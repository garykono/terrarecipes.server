import { FilterOp } from "../../../types/policy";

const { isPlainObject } = require("../../helpers");

const KNOWN_OPS = new Set([
    'eq','ne','gt','gte','lt','lte','between','in','all','nin','contains','exact','exists'
]);

const splitCSV = (v: unknown): string[] => {
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

const toVals = (v: unknown): string[] => Array.isArray(v) ? v.flatMap(splitCSV) : splitCSV(v);

// Result shape for a field when a specific op is used
export interface NormalizedOpFilter {
    op: FilterOp;
    vals: string[];
}

// Overall output type: field → either op filter or plain list of values
export type NormalizedFilters = Record<string, NormalizedOpFilter | string[]>;

/**
 * Parses known operations out of each individual query.
 * 
 * @param {*} query An object of records where keys are the query name and values can be a value or a value and an operation
 * ex. { totalTimeMin: { lte: '15' }, hasTag: 'meal-lunch', search: 'beef' }
 * @returns An object representing a query, but with any known operations parsed out.
 * ex. {
    totalTimeMin: { op: 'lte', vals: [ '15' ] },
    hasTag: [ 'meal-lunch' ],
    search: [ 'beef' ]
    }
 */
export const normalizeAndSanitizeFilters = (
    query: Record<string, unknown>, 
    allowedFilters: string[] | Set<string> = []
) => {
    const out: NormalizedFilters = {};

    const allowSet =
        allowedFilters instanceof Set
        ? allowedFilters
        : new Set<string>(allowedFilters);

    for (const [field, rawVal] of Object.entries(query)) {
        if (!allowSet.has(field)) continue;
        
        if (isPlainObject(rawVal)) {
            const obj = rawVal as Record<string, unknown>;
            const ops = Object.keys(obj).filter((k): k is FilterOp =>
                KNOWN_OPS.has(k as FilterOp)
        );

        if (ops.length === 1) {
            const op = ops[0];
            out[field] = {
            op,
            vals: toVals(obj[op]),
            };
            continue;
        }

        if (ops.includes("gte") && ops.includes("lte")) {
            out[field] = {
            op: "between",
            vals: [obj.gte, obj.lte].flatMap(toVals),
            };
            continue;
        }

        if (ops.includes("gt") && ops.includes("lt")) {
            out[field] = {
            op: "between",
            vals: [obj.gt, obj.lt].flatMap(toVals),
            };
            continue;
        }

        // object but no usable op combo → treat as equality-ish
        out[field] = toVals(obj);
        continue;
        }

        // plain value(s)
        const vals = toVals(rawVal);
        if (vals.length) out[field] = vals;
    }

    return out;
}