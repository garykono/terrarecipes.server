const { isPlainObject } = require("../../helpers");

const KNOWN_OPS = new Set([
    'eq','ne','gt','gte','lt','lte','between','in','all','nin','contains','exact','exists'
]);

const splitCSV = v => {
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

const toVals = v => Array.isArray(v) ? v.flatMap(splitCSV) : splitCSV(v);

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
exports.normalizeAndSanitizeFilters = (query, allowedFilters = {}) => {
    const out = {};

    for (const [field, rawVal] of Object.entries(query)) {
        if (allowedFilters.has(field) && isPlainObject(rawVal)) {
            const ops = Object.keys(rawVal).filter(k => KNOWN_OPS.has(k));
            if (ops.length === 1) {
                const op = ops[0];
                out[field] = { op, vals: toVals(rawVal[op]) };
                continue;
            }
            if (ops.includes('gte') && ops.includes('lte')) {
                out[field] = { op: 'between', vals: [rawVal.gte, rawVal.lte].flatMap(toVals) };
                continue;
            }
            if (ops.includes('gt') && ops.includes('lt')) {
                out[field] = { op: 'between', vals: [rawVal.gt, rawVal.lt].flatMap(toVals) };
                continue;
            }
            // object but no known op keys → fall back to equality-ish
            out[field] = toVals(rawVal);
            continue;
        }

        // plain value(s)
        const vals = toVals(rawVal);
        if (vals.length) out[field] = vals;
    }

    return out;
}