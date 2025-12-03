import { toRegex, filtersToMongo } from "../searchHelpers.js";
import { buildSortFilter, buildMatchScoreField, buildSearchFilter } from "./searchBuilderHelpers.js";
import logger from "../../logger";
import { FieldMap, FilterMap, FiltersInput } from "../../../types/policy.js";

/** A single text search clause */
export interface SearchClause {
    term: string | RegExp;
    searchMode?: "contains" | "exact";
    wholeWord?: boolean;
    flexSep?: boolean;
    searchFields?: string[];
    boost?: number;
    scoreOnly?: boolean;
    negate?: boolean;
    join?: "$and" | "$or";
}

/** Shape of the search profile used to control behavior */
export interface SearchProfile {
    defaultSearchFields?: string[];
    allowedSearchFields?: string[];
    allowTextSearch?: boolean;
    defaultSort?: string;
    allowedSort?: string[];
    projection?: string[];
    pageLimits?: {
        defaultPerPage: number;
    };
}

/** Maps for filters and fields */
export interface ProfileMaps {
  filterMap: FilterMap;
  fieldMap: FieldMap;
}

/** Options passed into buildSearch */
export interface BuildSearchOptions {
    profile: SearchProfile;
    profileMaps: ProfileMaps;
    searchClauses?: SearchClause[];
    andFilters?: FiltersInput[];
    orFilters?: FiltersInput;
    sort?: string;
    page?: number | string;
    limit?: number | string;
}

export type SearchDocumentsOptions = BuildSearchResult;

/** Output of buildSearch */
export interface BuildSearchResult {
    matchFilters: Record<string, unknown>;
    addFields?: { matchScore: unknown };
    sortObj: Record<string, 1 | -1>;
    project?: Record<string, 1>;
    page: number;
    limit: number;
    useAggregate: boolean;
}

/**
 * Builds all requirements needed for a mongoose search from normalized search parameters.
 * 
 * @param {*} options Normalized and sanitized search criteria from a request.
 * @returns 
 */
export const buildSearch = ({ 
    profile, 
    profileMaps,
    searchClauses,
    andFilters, 
    orFilters,
    sort,
    page, 
    limit  
}: BuildSearchOptions) => {
    if (!profile) {
        throw new Error("No profile was given, and one is required to build searches.");
    }
    if (!profileMaps) {
        throw new Error("No profile maps were given, and are required to build searches.");
    } else if (!profileMaps.filterMap) {
        throw new Error("No profile filter map was given, and is required to build searches.");
    } else if (!profileMaps.fieldMap) {
        throw new Error("No profile field map was given, and are required to build searches.");
    }

    const { filterMap, fieldMap } = profileMaps;

    // Default fields (used when a clause doesn't specify searchFields)
    const defaultSearchFields = 
        Array.isArray(profile.defaultSearchFields) && profile.defaultSearchFields.length
            ? profile.defaultSearchFields
            : (profile.allowedSearchFields || []);

            
    // -------------------------
    // Build the $match (clauses)
    // -------------------------
    const addScorePieces: unknown[] = [];
    const clauseNodes:  Record<string, unknown>[] = [];   // built filters per clause (respecting negate/scoreOnly)
    const clauseJoins: ("$and" | "$or")[] = [];   // "$and" | "$or" for each clause (ignored for the first)

    if (profile.allowTextSearch && Array.isArray(searchClauses) && searchClauses.length) {
        searchClauses.forEach((c, idx) => {
            const regex = toRegex(c.term, {
                searchMode: c.searchMode || "contains",
                wholeWord: c.wholeWord !== false, // default true
                flexSep:  c.flexSep  !== false,   // default true
            });
            if (!regex) return;

            const fieldsForClause =
                Array.isArray(c.searchFields) && c.searchFields.length
                    ? c.searchFields
                    : defaultSearchFields;

            // OR across the mapped field paths for this clause
            const orBlock = { $or: buildSearchFilter(regex, fieldsForClause, fieldMap) };

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
   const andNodes = (andFilters || [])
        .map(block => {
            const clauses = filtersToMongo(block, filterMap).filter(Boolean);
            if (clauses.length === 0) return null;
            return clauses.length === 1 ? clauses[0] : { $and: clauses };
        })
        .filter(Boolean);

    const andNode =
        andNodes.length === 0
            ? null
            : andNodes.length === 1
                ? andNodes[0]
                : { $and: andNodes };

    // 2) OR node: each field in orFilters becomes one OR alternative.
    //    We compile each field as its own block, then (if multiple clauses) AND them inside that alternative.
    let orNode = null;
    if (orFilters && Object.keys(orFilters).length) {
        const orClauses = [];
            for (const [key, spec] of Object.entries(orFilters)) {
                const clauses = filtersToMongo({ [key]: spec }, filterMap).filter(Boolean);
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
    const sortObj = buildSortFilter(
        sort || profile.defaultSort || "-createdBy",
        profile.allowedSort ?? []
    );
    const project = Array.isArray(profile.projection)
        ? profile.projection.reduce<Record<string, 1>>((acc, k) => {
            acc[k] = 1;
            return acc;
        }, {})
        : undefined;

    const defaultPerPage = profile.pageLimits?.defaultPerPage ?? 24; // <- global fallback

    // We must aggregate if we have derived fields or we sort by them.
    const needsAggregate = Boolean(addFields) || (sortObj && Object.prototype.hasOwnProperty.call(sortObj, "matchScore"));

    logger.debug({ matchFilters, addFields, sortObj, project, page, limit, needsAggregate}, "build search info");

    return {
        matchFilters,
        addFields,          // undefined when not needed
        sortObj,            // usable by both find() and aggregate
        project,            // optional projection
        page: Number(page || 1),
        limit: Number(limit || defaultPerPage),
        useAggregate: needsAggregate,
    };
};