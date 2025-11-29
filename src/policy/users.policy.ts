import { EndpointProfiles, ProfileMaps } from "../types/policy";

export const USER_PROFILE_MAPS: ProfileMaps = {
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

export const USER_EMAIL_THROTTLING = {
    signup: {
        minIntervalMs: 60 * 1000,       // 1 minute between "resend verification" calls
        windowMs: 24 * 60 * 60 * 1000,  // 24 hours
        maxInWindow: 5,
    },
    passwordReset: {
        minIntervalMs: 60 * 1000,       // 1 minute
        windowMs: 24 * 60 * 60 * 1000,
        maxInWindow: 5,
    },
    changeEmail: {
        minIntervalMs: 60 * 1000,       // 1 minute
        windowMs: 24 * 60 * 60 * 1000,
        maxInWindow: 5,
    },
};

const USER_SORT_KEYS = ["username", "createdAt", "role"];

export const USER_DEFAULT_SORT_KEY = "-createdAt";

const USER_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
type UserFilterMap = typeof USER_PROFILE_MAPS["filterMap"];
type UserFieldMap  = typeof USER_PROFILE_MAPS["fieldMap"];

// All profiles object type
export type UserProfiles = EndpointProfiles<UserFilterMap, UserFieldMap>;

// A single profile (e.g. UserS_PROFILES["getAll"])
export type UserProfileKey = keyof UserProfiles;
export type UserProfile = UserProfiles[UserProfileKey];

export const USERS_PROFILES: UserProfiles = {
    signUp: {
        allowedBody: [
            "username",
            "email",
            "password",
            "passwordConfirm"
        ],
        strictWhiteListing: true
    },
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
        defaultSort: USER_DEFAULT_SORT_KEY, 
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
    },

    updateEmail: {
        allowedBody: [
            "newEmail", "password"
        ],
        strictWhiteListing: true
    }
};