import mongoose from "mongoose";
import { FilterConfig, FilterMap, FilterOp, FilterPayload, FiltersInput, FilterType, SearchMode } from "../../types/policy";
import { normalizeVals } from "../arrays";
import { castValue, castMany } from "../cast";
import { escapeRx } from "../strings";

interface ToRegexOptions {
    searchMode?: SearchMode;
    /** Only used for "contains" mode */
    wholeWord?: boolean;
    /** Treat spaces and hyphens as equivalent between tokens */
    flexSep?: boolean;
}

/**
 * Build a RegExp from a user string.
 * - mode: "contains"  => like your current behavior (phrase contained within the field)
 * - mode: "exact"    => whole-field phrase match (trimmed, CI, space/hyphen equivalent)
 * - flexSep: treat spaces and hyphens as equivalent between tokens
 * - wholeWord (only for "contains"): wrap with \b ... \b
 */
export const toRegex = (
    input: string | RegExp | null | undefined,
    {
        searchMode = "contains",
        wholeWord = true,   // only used for contains
        flexSep = true
    }: ToRegexOptions = {}
) => {
    if (input instanceof RegExp) return input;

    const raw = String(input ?? "").trim();
    if (!raw) return null;

    const tokens = raw.split(/[\s-]+/).filter(Boolean).map(escapeRx);
    if (tokens.length === 0) return null;

    const sep = flexSep ? "[\\s-]+" : "\\s+";
    const body = tokens.join(sep);

    if (searchMode === "exact") {
        // Anchored, trims tolerated on either side
        return new RegExp(`^\\s*${body}\\s*$`, "i");
    }

    // searchMode === "contains"
    const pattern = wholeWord ? `\\b${body}\\b` : body;
    return new RegExp(pattern, "i");
};

const resolveOp = (
    spec: FilterConfig, 
    requestedOp: FilterOp | undefined, 
    vals: unknown[]
): FilterOp => {
    let op: FilterOp | undefined = requestedOp || spec.defaultOp;
    if (!op) {
        // heuristic: 2 values & supports between → assume between
        if (spec.allowedOps?.includes('between') && Array.isArray(vals) && vals.length === 2) op = 'between';
        else op = vals.length > 1 ? 'in' : 'eq';
    }
    if (spec.allowedOps && !spec.allowedOps.includes(op) && !spec.prefix) {
        throw new Error(`Unsupported op "${op}" for ${spec.path}. Allowed: ${spec.allowedOps.join(', ')}`);
    }
    return op;
}

const buildCondition = (
    path: string,
    op: FilterOp,
    vals: unknown[],
    type: FilterType
): Record<string, unknown> => {
    switch (op) {
        case 'eq':       return { [path]: castValue(vals[0], type) };
        case 'ne':       return { [path]: { $ne:  castValue(vals[0], type) } };
        case 'gt':       return { [path]: { $gt:  castValue(vals[0], type) } };
        case 'gte':      return { [path]: { $gte: castValue(vals[0], type) } };
        case 'lt':       return { [path]: { $lt:  castValue(vals[0], type) } };
        case 'lte':      return { [path]: { $lte: castValue(vals[0], type) } };
        case 'between': {
        // supports [min,max] or {from,to}/{min,max}
        let a = vals;
        if (!Array.isArray(vals) || vals.length < 2) {
            const v = (vals[0] ?? {}) as {
                from?: unknown;
                to?: unknown;
                min?: unknown;
                max?: unknown;
            };
            a = [v.from ?? v.min, v.to ?? v.max];
        }
        const [min, max] = castMany(a, type);
        if (min == null || max == null) throw new Error(`between requires two values for ${path}`);
            return { [path]: { $gte: min, $lte: max } };
        }
        case 'in':       return { [path]: { $in:  castMany(vals, type) } };
        case 'all':      return { [path]: { $all: castMany(vals, type) } }; // array field
        case 'nin':      return { [path]: { $nin: castMany(vals, type) } };
        case 'exact':    return { [path]: toRegex(vals[0] as string | RegExp, { searchMode: "exact" }) };
        case 'contains': return { [path]: toRegex(vals[0] as string | RegExp, { searchMode: "contains" }) };
        default:
            throw new Error(`Unsupported op "${op}" for ${path}`);
    }
}


/**
 * Normalize custom filters to traverse tags more accurately, handle known operations, and then convert all filters into mongoose match 
 * conditions.
 * 
 * @param {*} filters 
 * @returns 
 */
export const filtersToMongo = (
    filters: FiltersInput = {},
    filterMap: FilterMap
): Record<string, unknown>[] => {
    const and: Record<string, unknown>[] = [];

    for (const [key, payloadRaw] of Object.entries(filters)) {
        const spec = filterMap[key];
        if (!spec) continue;

        // Narrow/cast the raw payload into payload shape
        const payload = payloadRaw as FilterPayload;

        const rawVals = payload?.vals ?? payload;
        const valsRaw = normalizeVals(rawVals);
        if (valsRaw.length === 0) continue;

        if (spec.prefix) {
            const prefix = spec.prefix;
            // facet shortcuts: meal=dinner → "meal-dinner"
            const prefixed = valsRaw.map((v: unknown) => {
                const s = String(v).trim().toLowerCase();
                return s.startsWith(prefix) ? s : `${spec.prefix}${s}`;
            });
            and.push({ [spec.path]: prefixed.length > 1 ? { $in: prefixed } : prefixed[0] });
            continue;
        }

        const op = resolveOp(spec, payload?.op, valsRaw);
        and.push(buildCondition(spec.path, op, valsRaw, spec.type || 'string'));
    }

    return and;
}

export const normalizeIds = (raw: unknown): mongoose.Types.ObjectId[] | undefined => {
    if (!raw) return undefined;

    const arr = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
            ? raw.split(",")   // allow comma-separated list
            : [];

    if (!arr.length) return undefined;

    const ids = arr
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);

    const unique = Array.from(new Set(ids));

    const valid = unique
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

    return valid.length ? valid : undefined;
};

export const orderByIdList = <T extends { _id: any }>(docs: T[], ids: string[]): T[] => {
    const map = new Map(docs.map((d) => [String(d._id), d]));
    return ids.map((id) => map.get(String(id))).filter(Boolean) as T[];
}