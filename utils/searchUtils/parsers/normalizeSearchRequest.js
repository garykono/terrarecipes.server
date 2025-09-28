const { normalizeSearchClauses } = require("./normalizeSearchClauses");
const { parseSearchString } = require("./textSearchParser");
const { normalizeAndSanitizeFilters } = require("./parseFilters");

/**
 * Takes a search request payload and then parses out and sanitizes accepted search criteria.
 * 
 * @param {*} payload req.query for GET endpoints and req.body for POST endpoints
 * @param {*} profile Policy profile used for whitelisting
 * @returns     
 */
exports.normalizeSearchRequest = (
    payload = {}, 
    profile 
) => {
    // Extract known fields from GET or POST
    const rawSearch   = payload.search;
    const rawSearchClauses = payload.searchClauses;
    const rawAndFilters = payload.andFilters;
    let rawOrFilters = payload.orFilters;
    const rawSort     = payload.sort;
    const rawPage     = payload.page;
    const rawLimit    = payload.limit;

    // Whitelist by profile
    const allowedSearchFields  = new Set(profile.allowedSearchFields || []);
    const allowedFilters = new Set(profile.allowedFilters || []);
    const allowedSort    = new Set(profile.allowedSort || []);
    const pageLimits     = profile.pageLimits || RECIPE_PAGE_LIMITS;    

    // Normalize explicit clauses from body (advanced search)
    const clausesFromBody = rawSearchClauses
        ? normalizeSearchClauses(rawSearchClauses, allowedSearchFields)
        : [];

    // text search
    const normalizedSearchString = typeof rawSearch === 'string' ? rawSearch.trim() : undefined;
    const clausesFromSearch = normalizedSearchString
        ? normalizeSearchClauses(parseSearchString(normalizedSearchString), allowedSearchFields)
        : [];

    // combine all search clauses
    const searchClauses = [...clausesFromBody, ...clausesFromSearch];

    // normalize and sanitize custom filters
    // Supports: field=value, field=a,b, field[op]=..., field.op=...
    const normalizedAll = normalizeAndSanitizeFilters(payload, allowedFilters);

    // For advanced search, also check if explicit "$and" or "$or" filters were given
    let andFilters = rawAndFilters 
        ? normalizeAndSanitizeFilters(rawAndFilters, allowedFilters)
        : {}

    const orFilters = rawOrFilters 
        ? normalizeAndSanitizeFilters(rawOrFilters, allowedFilters)
        : {}

    // combine payload filters (assumed they are $and) and andFilters
    if (normalizedAll && Object.keys(normalizedAll).length) andFilters = {
        ...andFilters,
        ...normalizedAll
    };

    // sort (sanitize tokens)
    const sort =
        typeof rawSort === "string"
            ? rawSort
                .split(",")
                .map((s) => s.trim())
                .filter((token) => {
                    const k = token.startsWith("-") ? token.slice(1) : token;
                    return allowedSort.has(k);
                })
                .join(",")
            : profile.defaultSort || undefined;

    // pagination
    const page = rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;
    const limit = rawLimit
        ? Math.min(
                pageLimits.max,
                Math.max(pageLimits.min, parseInt(rawLimit, 10) || pageLimits.defaultPerPage)
            )
        : pageLimits.defaultPerPage;

    return { searchClauses, andFilters, orFilters, sort, page, limit };
}