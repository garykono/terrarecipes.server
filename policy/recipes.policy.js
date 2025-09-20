/* HAVEN'T FULLY IMPLEMENTED THIS FILE. JUST PLACING SOME CONSTANTS HERE TO BEGIN USING */

exports.RECIPE_FILTER_MAP = {
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
};

exports.FIELD_MAP = {
    name: ["name"],
    ingredients: ["ingredients.parsed.ingredient", "ingredients.text"],
    tags: ["tagsFlat"]
}

RECIPE_SORT_KEYS = ["name", "createdAt", "author", "matchScore"];

exports.RECIPE_DEFAULT_SORT_KEY = "createdAt";

RECIPE_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
exports.RECIPES_PROFILES = {
    getAll: {
        allowedSearchFields: ["name",  "tags",  "ingredients"],        // search 'fields=' whitelist
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
        defaultSort: "-createdAt", 
        pageLimits: RECIPE_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: ["_id", "name", "slug", "image", "servings", "totalTimeMin", "createdAt", "author", "tags"], 
    }, 

    searchAdvanced: { // POST /recipes/search
        allowedSearchFields: ["name", "tags", "ingredients"], 
        allowedFilters: ["meal", "course", "difficulty", "hasTag", "hasAllTags", "excludeTag"], 
        allowedSort: RECIPE_SORT_KEYS, 
        pageLimits: RECIPE_PAGE_LIMITS, 
    }, 

    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "name", "description", "image", "servings", "prepTimeMin", "cookTimeMin", "restTimeMin",
            "ingredients", "directions", "tags", "tagsFlat", "credit", "createdAt"
        ], 
        required: ["name", "ingredients", "tags"], 
    }, 

    update: {
        allowedBody: [
            "name", "description", "image", "servings", "prepTimeMin", "cookTimeMin", "restTimeMin",
            "ingredients", "directions", "tags", "tagsFlat", "credit", "createdAt"
        ], 
    }, 
};