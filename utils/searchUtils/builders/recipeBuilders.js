
const { RECIPES_PROFILES } = require("../../../policy/recipes.policy.js");
const { toRegex, filtersToMongo } = require("../searchHelpers.js");
const { buildSortFilter, buildRecipeSearchFilter, buildMatchScoreField } = require("./searchBuilders.js");

/**
 * Builds all requirements needed for a mongoose search from normalized search parameters.
 * 
 * @param {*} options Normalized and sanitized search criteria from a request.
 * @returns 
 */
exports.compileRecipeSearch = ({ 
    profileKey, 
    searchClauses,
    andFilters, 
    orFilters,
    sort,
    page, 
    limit  
} = options) => {
    const profile = RECIPES_PROFILES[profileKey] || {};

    // Default fields (used when a clause doesn't specify searchFields)
    const defaultSearchFields = 
        Array.isArray(profile.defaultSearchFields) && profile.defaultSearchFields.length
            ? profile.defaultSearchFields
            : (profile.allowedSearchFields || []);

            
    // -------------------------
    // Build the $match (clauses)
    // -------------------------
    const addScorePieces = [];
    const clauseNodes = [];   // built filters per clause (respecting negate/scoreOnly)
    const clauseJoins = [];   // "$and" | "$or" for each clause (ignored for the first)

    if (Array.isArray(searchClauses) && searchClauses.length) {
        searchClauses.forEach((c, idx) => {
            const regex = toRegex(c.term, {
                mode: c.searchMode || "contains",
                wholeWord: c.wholeWord !== false, // default true
                flexSep:  c.flexSep  !== false,   // default true
            });
            if (!regex) return;

            const fieldsForClause =
                Array.isArray(c.searchFields) && c.searchFields.length
                    ? c.searchFields
                    : defaultSearchFields;

            // OR across the mapped field paths for this clause
            const orBlock = { $or: buildRecipeSearchFilter(regex, fieldsForClause, profileKey) };

            // Scoring: add a piece even if this clause is score-only
            if ((c.searchMode || "contains") === "contains") {
                const part  = buildMatchScoreField(regex);    // { $add: [...] }
                const piece = part?.$add
                    ? (part.$add.length === 1 ? part.$add[0] : { $add: part.$add })
                    : null;

                if (piece) {
                    const boosted = (c.boost != null)
                    ? { $multiply: [Number(c.boost) || 1, piece] }
                    : piece;
                    addScorePieces.push(boosted);
                }
            }

            if (c.scoreOnly) return; // don’t filter, just score

            // Negation → wrap the OR block in $nor
            const node = c.negate ? { $nor: [orBlock] } : orBlock;

            clauseNodes.push(node);
            // For the first clause, we’ll ignore the join; default to $and afterwards
            clauseJoins.push(idx === 0 ? "$and" : (c.join === "$or" ? "$or" : "$and"));
        });
    }

    // Chain the nodes left→right by their joins to produce one expression. 
    // Essentially combining all the search clauses into a format readable by mongoose
    let expr = null;
    if (clauseNodes.length) {
        expr = clauseNodes[0];
        for (let i = 1; i < clauseNodes.length; i++) {
            const join = clauseJoins[i] || "$and";
            expr = join === "$or"
                ? { $or: [expr, clauseNodes[i]] }
                : { $and: [expr, clauseNodes[i]] };
        }
    }

    // Add in structured filters
    // 1) AND node: compile the whole object; AND its clauses
    const andClauses = andFilters ? filtersToMongo(andFilters).filter(Boolean) : [];
    const andNode =
        andClauses.length === 0
            ? null
            : andClauses.length === 1
                ? andClauses[0]
                : { $and: andClauses };

    // 2) OR node: each field in orFilters becomes one OR alternative.
    //    We compile each field as its own block, then (if multiple clauses) AND them inside that alternative.
    let orNode = null;
    if (orFilters && Object.keys(orFilters).length) {
        const orClauses = [];
            for (const [key, spec] of Object.entries(orFilters)) {
                const clauses = filtersToMongo({ [key]: spec }).filter(Boolean);
                if (clauses.length === 0) continue;
                const alt = clauses.length === 1 ? clauses[0] : { $and: clauses };
                orClauses.push(alt);
            }
            if (orClauses.length) {
                orNode = { $or: orClauses };
            }
    }

    // 3) Combine: (expr) AND (andNode) AND (orNode)
    let combinedFilters = null;
    for (const node of [expr ?? null, andNode, orNode]) {
        if (!node) continue;
        combinedFilters = combinedFilters ? { $and: [combinedFilters, node] } : node;
    }

    // 4) Final match
    const matchFilters = combinedFilters ?? {};

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