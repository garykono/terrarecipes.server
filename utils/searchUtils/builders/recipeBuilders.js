
const { RECIPES_PROFILES } = require("../../../policy/recipes.policy.js");
const { toRegex, filtersToMongo } = require("../searchHelpers.js");
const { buildSortFilter, buildRecipeSearchFilter, buildMatchScoreField } = require("./searchBuilders.js");

/**
 * Accepts normalized options from your parser middleware:
 *   req.parsed.recipeSearch = { profileKey, search?, mode?, fields?, clauses?, filters, sort, page, perPage }
 * Returns the compiled object both find() and aggregate() can consume.
 */
exports.compileRecipeSearch = ({ 
    profileKey, 
    clauses,
    search, 
    searchMode = "contains", 
    searchFields, 
    filters, 
    sort,
    page, 
    limit  
} = options) => {
    const profile = RECIPES_PROFILES[profileKey] || {};
    const and = [];

    // --- Text search: multi-clause (advanced) or single fallback ---
    const addScorePieces = []; // collect score parts if we need matchScore

    if (!!clauses && Array.isArray(clauses) && clauses.length) {
        for (const c of clauses) {
            const regex = toRegex(c.term, { searchMode: c.searchMode || "contains", wholeWord: false, flexSep: true });
            if (!regex) continue;
            and.push({ $or: buildRecipeSearchFilter(regex, c.searchFields, profileKey) });

            if (c.searchMode === "contains") {
                const part = buildMatchScoreField(regex);
                addScorePieces.push(...part.$add);
            }
        }
    } else if (search) {
        const regex = toRegex(search, { searchMode, wholeWord: false });
        if (regex) {
            and.push({ $or: buildRecipeSearchFilter(regex, searchFields, profileKey) });
            if (searchMode === "contains") {
                const score = buildMatchScoreField(regex);
                addScorePieces.push(...score.$add);
            }
        }
    }

    // --- Normalize the filters
    // --- Exact filters (facets, hasTag, etc.) ---
    const filterClauses = filtersToMongo(filters);
    if (filterClauses.length) and.push(...filterClauses);

    const matchFilters = and.length ? { $and: and } : {};

    // --- addFields / scoring (only if we built any pieces) ---
    const addFields = addScorePieces.length ? { matchScore: { $add: addScorePieces } } : undefined;

    // --- sort/projection/pagination/collation ---
    const sortObj = buildSortFilter(sort || profile.defaultSort || "");
    const project = Array.isArray(profile.projection)
        ? profile.projection.reduce((acc, k) => ((acc[k] = 1), acc), {})
        : undefined;

    // We must aggregate if we have derived fields or we sort by them.
    const needsAggregate = Boolean(addFields) || (sortObj && Object.prototype.hasOwnProperty.call(sortObj, "matchScore"));

    return {
        matchFilters,
        addFields,          // undefined when not needed
        sortObj,            // usable by both find() and aggregate
        project,            // optional projection
        page: Number(page || 1),
        limit: Number(limit || profile.pageLimits.defaultPerPage),
        useAggregate: needsAggregate,
    };
};