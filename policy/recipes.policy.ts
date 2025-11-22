/* HAVEN'T FULLY IMPLEMENTED THIS FILE, ONLY RECIPE_PROFILES.GETALL */

import { EndpointProfiles, ProfileMaps } from "../types/policy";

export const RECIPE_PROFILE_MAPS: ProfileMaps = {
    filterMap : {
        name:        { path: "name",        type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" },
        description: { path: "description", type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" },

        servings: { path: "servings", type: "number", allowedOps: ["eq","ne","gt","gte","lt","lte","between","in"], defaultOp: "eq" },
        totalTimeMin: { path: "totalTimeMin", type: "number", allowedOps: ["eq","ne","gt","gte","lt","lte","between","in"], defaultOp: "eq" },
        createdAt:   { path: "createdAt",   type: "date",   allowedOps: ["eq","ne","gt","gte","lt","lte","between"] },

        meal:       { path: "tags.facets.meal",   type: "string", prefix: "meal-"   },
        course:     { path: "tags.facets.course", type: "string", prefix: "course-" },
        difficulty: { path: "tags.facets.difficulty", type: "string", prefix: "difficulty-" },

        hasTag:     { path: "tagsFlat", type: "string", allowedOps: ["in","all","nin"], defaultOp: "in" },
        hasAllTags: { path: "tagsFlat", type: "string", allowedOps: ["all"],             defaultOp: "all" },
        excludeTag: { path: "tagsFlat", type: "string", allowedOps: ["nin"],             defaultOp: "nin" },
    },
    fieldMap : {
        name: ["name"],
        ingredients: ["ingredients.parsed.ingredient", "ingredients.text"],
        tags: ["tagsFlat"]
    }
}

const RECIPE_SORT_KEYS = ["name", "createdAt", "author", "matchScore"];

export const RECIPE_DEFAULT_SORT_KEY = "-createdAt";

export const RECIPE_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
type RecipeFilterMap = typeof RECIPE_PROFILE_MAPS["filterMap"];
type RecipeFieldMap  = typeof RECIPE_PROFILE_MAPS["fieldMap"];

// All profiles object type
export type RecipeProfiles = EndpointProfiles<RecipeFilterMap, RecipeFieldMap>;

// A single profile (e.g. RECIPES_PROFILES["getAll"])
export type RecipeProfileKey = keyof RecipeProfiles;
export type RecipeProfile = RecipeProfiles[RecipeProfileKey];

export const RECIPES_PROFILES: RecipeProfiles = {
    getAll: {
        allowTextSearch: true,
        allowedSearchFields: ["name",  "tags",  "ingredients"],        // search 'fields=' whitelist
        defaultSearchFields: ["name",  "tags",  "ingredients"], 
        allowedFilters: [
            "name", 
            "description", 
            "servings",
            "totalTimeMin", 
            "createdAt", 
            "meal", 
            "course", 
            "difficulty", 
            "hasTag", 
            "hasAllTags", 
            "excludeTag"], 
        allowedSort: RECIPE_SORT_KEYS, 
        defaultSort: RECIPE_DEFAULT_SORT_KEY, 
        pageLimits: RECIPE_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: ["_id", "name", "slug", "image", "servings", "totalTimeMin", "createdAt", "author", "tags"],
        strictWhiteListing: false
    }, 

    searchAdvanced: { // POST /recipes/search
        allowedSearchFields: ["name", "tags", "ingredients"], 
        allowedFilters: ["meal", "course", "difficulty", "hasTag", "hasAllTags", "excludeTag"], 
        allowedSort: RECIPE_SORT_KEYS, 
        pageLimits: RECIPE_PAGE_LIMITS,
        strictWhiteListing: false
    }, 

    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "name", "description", "image", "servings", "prepTimeMin", "cookTimeMin", "restTimeMin",
            "ingredients", "directions", "tags", "credit", "createdAt"
        ], 
        strictWhiteListing: true 
    }, 

    update: {
        allowedBody: [
            "name", "description", "image", "servings", "prepTimeMin", "cookTimeMin", "restTimeMin",
            "ingredients", "directions", "tags", "credit", "createdAt"
        ],
        strictWhiteListing: true  
    }, 
};