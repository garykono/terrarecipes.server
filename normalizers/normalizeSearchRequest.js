const { normalizeSearchClauses } = require("../utils/searchUtils/parsers/normalizeSearchClauses");
const { parseSearchString } = require("../utils/searchUtils/parsers/textSearchParser");
const { normalizeAndSanitizeFilters } = require("../utils/searchUtils/parsers/parseFilters");

/**
 * Takes a search request payload and then parses out and sanitizes accepted search criteria.
 * 
 * @param {*} payload req.query for GET endpoints and req.body for POST endpoints
 * @param {*} profile Policy profile used for whitelisting
 * @returns     
 */
exports.normalizeSearchRequest = (
    payload = {}, 
    profile = {}
) => {
    // Extract known fields from GET or POST
    const rawSearch   = payload.search;
    const rawSearchClauses = payload.searchClauses;
    const rawAndFilters = payload.andFilters;
    let rawOrFilters = payload.orFilters;
    const rawSort     = payload.sort;
    const rawPage     = payload.page;
    const rawLimit    = payload.limit;

    const clean = {};
    const rejected = {};

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
    clean.searchClauses = [...clausesFromBody, ...clausesFromSearch];

    // normalize and sanitize custom filters
    // Supports: field=value, field=a,b, field[op]=..., field.op=...
    const andFilterBlocks = [];

    const payloadAsAnd = normalizeAndSanitizeFilters(payload, allowedFilters);
    if (payloadAsAnd && Object.keys(payloadAsAnd).length) andFilterBlocks.push(payloadAsAnd);

    // For advanced search, also check if explicit "$and" or "$or" filters were given
    if (rawAndFilters) {
        const a = normalizeAndSanitizeFilters(rawAndFilters, allowedFilters);
        if (a && Object.keys(a).length) andFilterBlocks.push(a);
    }

    clean.andFilters = andFilterBlocks;

    clean.orFilters = rawOrFilters 
        ? normalizeAndSanitizeFilters(rawOrFilters, allowedFilters)
        : {}

    // sort (sanitize tokens)
    clean.sort =
        typeof rawSort === "string"
            ? rawSort
                .split(",")
                .map((s) => s.trim())
                .filter((token) => {
                    const k = token.startsWith("-") ? token.slice(1) : token;
                    return allowedSort.has(k);
                })
                .join(",")
            : undefined;

    // pagination
    clean.page = rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;
    clean.limit = rawLimit
        ? Math.min(
                pageLimits.max,
                Math.max(pageLimits.min, parseInt(rawLimit, 10) || pageLimits.defaultPerPage)
            )
        : pageLimits.defaultPerPage;

    return { clean, rejected };
}