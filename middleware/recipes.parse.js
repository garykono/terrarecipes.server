const { RECIPES_PROFILES, RECIPE_PAGE_LIMITS } = require("../policy/recipes.policy");
const { normalizeFiltersFromQuery } = require("../utils/filtering/parseFilters");
const { parseSearchString } = require("../utils/searchUtils/searchParser");

exports.parseRecipeQuery = (profileKey = "getAll") => {  
    return (req, res, next) => {
        const profile = RECIPES_PROFILES[profileKey];
        if (!profile) throw new Error(`Unknown recipes profile: ${profileKey}`);

        const allowedSearchFields  = new Set(profile.allowedSearchFields || []);
        const allowedFilters = new Set(profile.allowedFilters || []);
        const allowedSort    = new Set(profile.allowedSort || []);
        const pageLimits     = profile.pageLimits || RECIPE_PAGE_LIMITS;

        // REQUIRED TO USE parseSearchString. add this back when i decide the structure for a "clause" (what will be used when doing
        //  multi text searches later, and in parseRecipeAdvancedBody)
        // Turn raw search string into logical groups/clauses (tokens/phrases, AND/OR)
        // const clauses = typeof req.query.search === 'string' && req.query.search.trim()
        //     ? parseSearchString(req.query.search.trim(), { /* quotesAsPhrase: true by default */ })
        //     : [];
        const clauses = undefined;

        // text search
        const search = typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : undefined;
        const searchMode = ["contains", "exact"].includes(String(req.query.searchMode)) ? req.query.searchMode : "contains";

        // fields
        const searchFields =
            typeof req.query.searchFields === "string"
                ? req.query.searchFields
                    .split(",")
                    .map((s) => s.trim())
                    .filter((f) => allowedSearchFields.has(f))
                : undefined;

        // --- filters: normalize user query, then whitelist keys allowed by this profile ---
        // Supports: field=value, field=a,b, field[op]=..., field.op=...
        const normalizedAll = normalizeFiltersFromQuery(req.query);

        const filters = Object.fromEntries(
            Object.entries(normalizedAll).filter(([key]) => allowedFilters.has(key))
        );

        // sort (sanitize tokens)
        const sort =
            typeof req.query.sort === "string"
                ? req.query.sort
                    .split(",")
                    .map((s) => s.trim())
                    .filter((token) => {
                        const k = token.startsWith("-") ? token.slice(1) : token;
                        return allowedSort.has(k);
                    })
                    .join(",")
                : profile.defaultSort || undefined;

        // pagination
        const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : 1;
        const limit = req.query.limit
            ? Math.min(
                    pageLimits.max,
                    Math.max(pageLimits.min, parseInt(req.query.limit, 10) || pageLimits.defaultPerPage)
                )
            : pageLimits.defaultPerPage;

        req.parsed = { profileKey, clauses, search, searchMode, searchFields, filters, sort, page, limit };
        
        next();
    }
}

exports.parseRecipeAdvancedBody = (profileKey = "searchAdvanced") => {
    return (req, res, next) => {
        
        next();
    }
}