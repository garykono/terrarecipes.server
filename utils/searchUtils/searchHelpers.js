const { normalizeVals } = require("../arrays");
const { castValue, castMany } = require("../cast")
const { escapeRx } = require("../strings")

/**
 * Build a RegExp from a user string.
 * - mode: "contains"  => like your current behavior (phrase contained within the field)
 * - mode: "exact"    => whole-field phrase match (trimmed, CI, space/hyphen equivalent)
 * - flexSep: treat spaces and hyphens as equivalent between tokens
 * - wholeWord (only for "contains"): wrap with \b ... \b
 */
exports.toRegex = (
    input,
    {
        searchMode = "contains",
        wholeWord = true,   // only used for contains
        flexSep = true
    } = {}
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

const resolveOp = (spec, requestedOp, vals) => {
    let op = requestedOp || spec.defaultOp;
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

const buildCondition = (path, op, vals, type) => {
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
            const v = vals[0] ?? {};
            a = [v.from ?? v.min, v.to ?? v.max];
        }
        const [min, max] = castMany(a, type);
        if (min == null || max == null) throw new Error(`between requires two values for ${path}`);
            return { [path]: { $gte: min, $lte: max } };
        }
        case 'in':       return { [path]: { $in:  castMany(vals, type) } };
        case 'all':      return { [path]: { $all: castMany(vals, type) } }; // array field
        case 'nin':      return { [path]: { $nin: castMany(vals, type) } };
        case 'exact':    return { [path]: this.toRegex(vals[0], { searchMode: "exact" }) };
        case 'contains': return { [path]: this.toRegex(vals[0], { searchMode: "contains" }) };
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
exports.filtersToMongo = (filters = {}, filterMap) => {
    const and = [];

    for (const [key, payload] of Object.entries(filters)) {
        const spec = filterMap[key];
        if (!spec) continue;

        const valsRaw = normalizeVals(payload?.vals ?? payload);
        if (valsRaw.length === 0) continue;

        if (spec.prefix) {
            // facet shortcuts: meal=dinner → "meal-dinner"
            const prefixed = valsRaw.map(v => {
                const s = String(v).trim().toLowerCase();
                return s.startsWith(spec.prefix) ? s : `${spec.prefix}${s}`;
            });
            and.push({ [spec.path]: prefixed.length > 1 ? { $in: prefixed } : prefixed[0] });
            continue;
        }

        const op = resolveOp(spec, payload?.op, valsRaw);
        and.push(buildCondition(spec.path, op, valsRaw, spec.type || 'string'));
    }

    return and;
}

