/* HAVEN'T FULLY IMPLEMENTED THIS FILE */

exports.COLLECTIONS_PROFILE_MAPS = {
    filterMap: {
        name: { path: "name",        type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" }
    },
    fieldMap : {
        name: ["name"],
    }
}

COLLECTIONS_SORT_KEYS = ["name", "createdAt", "author"];

exports.COLLECTIONS_DEFAULT_SORT_KEY = "-createdAt";

COLLECTIONS_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
exports.COLLECTIONS_PROFILES = {
    getAll: {
        allowedSearchFields: ["name"],
        defaultSearchFields: ["name"], 
        allowedFilters: [
            "name", 
            "author",
            "createdAt"
        ], 
        allowedSort: COLLECTIONS_SORT_KEYS, 
        defaultSort: this.COLLECTIONS_DEFAULT_SORT_KEY, 
        pageLimits: COLLECTIONS_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: ["_id", "name", "description", "recipes", "author", "createdAt"],
        strictWhiteListing: false
    }, 

    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "name", "description", "createdAt"
        ], 
        strictWhiteListing: true
    }, 

    update: {
        allowedBody: [
            "name", "description", "recipes", "createdAt"
        ],
        strictWhiteListing: true  
    }, 

    updateMe: {
        allowedBody: [
            "name", "description", "recipes", "createdAt"
        ],
        strictWhiteListing: true  
    }, 
};