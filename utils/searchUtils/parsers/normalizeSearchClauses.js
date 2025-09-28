const VALID_JOINS = new Set(["$and", "$or"]);
const VALID_SEARCH_MODES = new Set(["contains", "exact"]);

function toBool(v, fallback) {
    if (v === undefined) return fallback;
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
    return fallback;
}

function toNumber(v, fallback) {
    if (v === undefined || v === null || v === "") return fallback;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize an array of clause objects to:
 * {
 *   term: string,
 *   join?: "$and" | "$or", // ignored on first
 *   searchFields?: string[],
 *   searchMode?: "contains" | "exact",
 *   wholeWord?: boolean,    // default true (contains only)
 *   flexSep?: boolean,      // default true (contains only)
 *   scoreOnly?: boolean,    // default false
 *   negate?: boolean,       // default false
 *   boost?: number          // optional
 * }
 */
exports.normalizeSearchClauses = function normalizeSearchClauses(
    rawClauses,
    allowedSearchFields  = {}
) {
    if (!Array.isArray(rawClauses)) return [];

    const allowSet = allowedSearchFields ? new Set(allowedSearchFields) : null;
    const out = [];

    for (const raw of rawClauses) {
        if (!raw || typeof raw !== "object") continue;

        // --- term ---
        const term = typeof raw.term === "string" ? raw.term.trim() : "";
        if (!term) continue;

        // --- join ---
        let join = raw.join;
        if (!VALID_JOINS.has(join)) join = "$and"; // default; will be ignored on first

        // --- searchFields (optional & whitelisted) ---
        let searchFields;
        if (Array.isArray(raw.searchFields) && raw.searchFields.length) {
            const filtered = allowSet
                ? raw.searchFields.filter((f) => typeof f === "string" && allowSet.has(f))
                : raw.searchFields.filter((f) => typeof f === "string");
            if (filtered.length) {
                // de-dupe while preserving order
                const seen = new Set();
                searchFields = filtered.filter((f) => (seen.has(f) ? false : (seen.add(f), true)));
            }
        }

        // --- searchMode & matching knobs ---
        let searchMode =
            typeof raw.searchMode === "string" && VALID_SEARCH_MODES.has(raw.searchMode)
                ? raw.searchMode
                : "contains";

        // Only meaningful for "contains"
        const wholeWord = toBool(raw.wholeWord, true);
        const flexSep = toBool(raw.flexSep, true);

        // --- flags ---
        // If scoreOnly = true, this search clause will be ignored during the search, but used for scoring more relevant results higher
        const scoreOnly = toBool(raw.scoreOnly, false);
        const negate = toBool(raw.negate, false);   // Results will ignore matches where this search clause is true

        // --- boost (optional, not currently using) ---
        const boost = toNumber(raw.boost, undefined);

        out.push({
            term,
            join,
            searchFields,
            searchMode,
            wholeWord,
            flexSep,
            scoreOnly,
            negate,
            boost
        });
    }

    // Ignore join on the first clause explicitly (optional cleanup)
    if (out.length) delete out[0].join;

    return out;
};