exports.USER_PROFILE_MAPS = {
    filterMap: {
        username:    { path: "username",    type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" },
        createdAt:   { path: "createdAt",   type: "date",   allowedOps: ["eq","ne","gt","gte","lt","lte","between"] },
        role:     { path: "role", type: "string", allowedOps: ["in","all","nin"], defaultOp: "in" },
    },
    fieldMap : {
        username: ["username"],
        createdAt: ["createdAt"],
        role: ["role"]
    }
}

USER_SORT_KEYS = ["username", "createdAt", "role"];

exports.USER_DEFAULT_SORT_KEY = "-createdAt";

USER_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
exports.USERS_PROFILES = {
    resendVerification: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "email"
        ],
        strictWhiteListing: true
    },

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
        allowTextSearch: false,
        allowedSearchFields: ["username"],        // search 'fields=' whitelist
        defaultSearchFields: ["username"], 
        allowedFilters: [
            "username",
            "createdAt",
            "role"
        ], 
        allowedSort: USER_SORT_KEYS, 
        defaultSort: this.USER_DEFAULT_SORT_KEY, 
        pageLimits: USER_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: ["_id", "username", "createdAt", "role"],
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