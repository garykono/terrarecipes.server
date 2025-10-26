exports.USER_FILTER_MAP = {
    username:    { path: "username",    type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" },
    createdAt:   { path: "createdAt",   type: "date",   allowedOps: ["eq","ne","gt","gte","lt","lte","between"] },
    role:     { path: "role", type: "string", allowedOps: ["in","all","nin"], defaultOp: "in" },
};

exports.FIELD_MAP = {
    username: ["username"],
}

USER_SORT_KEYS = ["name", "createdAt"];

exports.USER_DEFAULT_SORT_KEY = "-createdAt";

USER_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
exports.USERS_PROFILES = {
    logIn: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "email", "password"
        ],
        strictWhiteListing: true
    }, 

    forgotPassword: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "email"
        ],
        strictWhiteListing: true
    }, 

    resetPassword: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "password", "passwordConfirm"
        ],
        strictWhiteListing: true
    }, 

    getAll: {
        allowedSearchFields: [],        // search 'fields=' whitelist
        defaultSearchFields: [], 
        allowedFilters: [], 
        allowedSort: USER_SORT_KEYS, 
        defaultSort: this.USER_DEFAULT_SORT_KEY, 
        pageLimits: USER_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: [],
        strictWhiteListing: false
    },

    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "username", "email", "password", "passwordConfirm", "role"
        ],
        strictWhiteListing: true
    }, 

    update: {
        allowedBody: [
            "username", "email"
        ],
        strictWhiteListing: true
    }, 

    updateMe: {
        allowedBody: [
            "username", "email"
        ],
        strictWhiteListing: true
    }, 

    updatePassword: {
        allowedBody: [
            "passwordCurrent", "password", "passwordConfirm"
        ],
        strictWhiteListing: true
    }
};