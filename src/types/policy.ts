import { Types } from "mongoose";

/** Search modes for regex text filters */
export type SearchMode = "contains" | "exact";

/** Allowed shapes of individual filter payloads coming from the client */
export type FilterVals = unknown | unknown[];

/** Shape of the filters arg: key → either payload object or raw value(s) */
export type FiltersInput = Record<string, FilterPayload | FilterVals>;

export interface FilterPayload {
  op?: FilterOp;
  vals?: FilterVals;
}

// What kinds of values can filters operate on
export type FilterType = "string" | "number" | "date" | "id"

export type FilterOp =
    | "contains"
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "between"
    | "in"
    | "all"
    | "nin"
    | "exact";

// Single filter definition like "name", "servings", "meal", etc.
export interface FilterConfig {
    path: string;               // Mongo path: "name", "tags.facets.meal", etc.
    type: FilterType;
    prefix?: string;            // e.g. "meal-" -> "meal-breakfast"
    allowedOps?: FilterOp[];
    defaultOp?: FilterOp;
}

// e.g. RECIPE_PROFILE_MAPS.filterMap
export type FilterMap = Record<string, FilterConfig>;

// e.g. RECIPE_PROFILE_MAPS.fieldMap
// "name" -> ["name"], "ingredients" -> ["ingredients.parsed.ingredient", "ingredients.text"]
export type FieldMap = Record<string, string[]>;

// Pagination config
export interface PageLimits {
    min: number;
    max: number;
    defaultPerPage: number;
}

// The pair { filterMap, fieldMap } – your PROFILE_MAPS
export interface ProfileMaps<F extends FilterMap = FilterMap, FM extends FieldMap = FieldMap> {
    filterMap: F;
    fieldMap: FM;
}

// A single profile taken from a given profiles map (union of values)
export type BaseProfile = EndpointProfile<FilterMap, FieldMap>;

// One endpoint profile, parameterized by the filter + field maps
export interface EndpointProfile<
    F extends FilterMap = FilterMap,
    FM extends FieldMap = FieldMap
> {
    // GET /recipes – text search vs filters only
    allowTextSearch?: boolean;

    // Which "logical fields" can be searched (keys of fieldMap)
    allowedSearchFields?: (keyof FM | string)[];
    defaultSearchFields?: (keyof FM | string)[];

    // Which filters are allowed (keys of filterMap)
    allowedFilters?: (keyof F | string)[];

    // Sorting
    allowedSort?: string[];
    defaultSort?: string;

    // Paging
    pageLimits?: PageLimits;

    // Optional projection for responses
    projection?: string[];

    // For create/update endpoints
    allowedBody?: string[];

    // Whether to reject any field not in allowedSearchFields / allowedFilters / allowedBody
    strictWhiteListing: boolean;
}

// Set of profiles keyed by endpoint name: getAll, create, update, searchAdvanced, etc.
export type EndpointProfiles<
    F extends FilterMap = FilterMap,
    FM extends FieldMap = FieldMap
> = Record<string, EndpointProfile<F, FM>>;
