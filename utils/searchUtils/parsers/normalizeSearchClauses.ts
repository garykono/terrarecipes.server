import { SearchClause } from "../builders/buildSearch";

const VALID_JOINS = new Set(["$and", "$or"]);
const VALID_SEARCH_MODES = new Set(["contains", "exact"]);

function toBool(v: unknown, fallback: boolean): boolean {
    if (v === undefined) return fallback;
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
    return fallback;
}

function toNumber(v: unknown, fallback: number | undefined): number | undefined {
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
export const normalizeSearchClauses = function normalizeSearchClauses(
    rawClauses: unknown,
    allowedSearchFields: string[] | Set<string> = []
) {
    if (!Array.isArray(rawClauses)) return [];

    const allowSet =
        allowedSearchFields instanceof Set
            ? allowedSearchFields
            : new Set(allowedSearchFields);
    
    const out: SearchClause[] = [];

    for (const raw of rawClauses) {
        if (!raw || typeof raw !== "object") continue;

        const clause = raw as {
            term?: unknown;
            join?: unknown;
            searchFields?: unknown;
            searchMode?: unknown;
            wholeWord?: unknown;
            flexSep?: unknown;
            scoreOnly?: unknown;
            negate?: unknown;
            boost?: unknown;
        };

        // --- term ---
        const term = typeof raw.term === "string" ? raw.term.trim() : "";
        if (!term) continue;

        // --- join ---
        let join = clause.join;
        let normalizedJoin: "$and" | "$or" | undefined;
        if (typeof join === "string" && VALID_JOINS.has(join as "$and" | "$or")) {
            normalizedJoin = join as "$and" | "$or";
        } else {
            normalizedJoin = "$and"; // default; will be ignored on first
        }

        // --- searchFields (optional & whitelisted) ---
        let searchFields: string[] | undefined;
        if (Array.isArray(clause.searchFields) && clause.searchFields.length) {
            const filtered = clause.searchFields.filter(
                (f): f is string => typeof f === "string"
            );

            const filteredAllowed = allowSet
                ? filtered.filter((f) => allowSet.has(f))
                : filtered;

            if (filteredAllowed.length) {
                // de-dupe while preserving order
                const seen = new Set<string>();
                searchFields = filteredAllowed.filter((f) => {
                    if (seen.has(f)) return false;
                    seen.add(f);
                    return true;
                });
            }
        }

        // --- searchMode & matching knobs ---
        let searchMode: "contains" | "exact" = "contains";
        if (typeof clause.searchMode === "string" &&
            VALID_SEARCH_MODES.has(clause.searchMode as "contains" | "exact")) {
            searchMode = clause.searchMode as "contains" | "exact";
        }

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
            join: normalizedJoin,
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