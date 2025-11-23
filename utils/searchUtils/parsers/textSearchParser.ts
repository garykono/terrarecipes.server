import { SearchClause } from "../builders/buildSearch";

/**
 * Parses a search string into tokens/phrases and detects AND/OR groups + phrases in quotes
 * 
 * @param {string} input A complex search string (uses quotes to indicate phrases, uses 'and' and 'or' to indicate how to interpret phrases)
 * @returns An array of search clauses that have not been normalized
 */
export const parseSearchString = (input: unknown) => {
    if (!input || typeof input !== "string") return [];

    // Match quoted phrases OR unquoted tokens
    const regex = /"([^"]+)"|(\S+)/g;
    const rawTokens = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        // match[1] = quoted phrase, match[2] = unquoted word
        rawTokens.push(match[1] || match[2]);
    }

    const clauses: SearchClause[] = [];
    let pendingJoin: "$and" | "$or" = "$and"; // default join for non-first clauses

    rawTokens.forEach((token, idx) => {
        const lower = token.toLowerCase();

        if (lower === "and") {
            pendingJoin = "$and";
            return;
        }
        if (lower === "or") {
            pendingJoin = "$or";
            return;
        }

        // Create a clause for this term
        const clause: SearchClause = {
            term: token.trim(),
            ...(idx > 0 ? { join: pendingJoin } : {}), // ignore join on first clause
            searchMode: "contains",
            wholeWord: true,
            flexSep: true,
            scoreOnly: false,
            negate: false,
        };

        clauses.push(clause);

        // Reset join back to AND for the next term by default
        pendingJoin = "$and";
    });

    return clauses;
};