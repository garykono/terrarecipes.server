/* HAVEN'T FULLY IMPLEMENTED THIS FILE */

import { EndpointProfiles, ProfileMaps } from "../types/policy";

export const COLLECTIONS_PROFILE_MAPS: ProfileMaps = {
    filterMap: {
        name: { path: "name",        type: "string", allowedOps: ["contains","eq","in","exact"], defaultOp: "contains" }
    },
    fieldMap : {
        name: ["name"],
    }
}

const COLLECTIONS_SORT_KEYS = ["name", "createdAt", "author"];

export const COLLECTIONS_DEFAULT_SORT_KEY = "-createdAt";

const COLLECTIONS_PAGE_LIMITS = { min: 1,  max: 100,  defaultPerPage: 20 };

// Endpoint profiles (subsets of the above)
type CollectionFilterMap = typeof COLLECTIONS_PROFILE_MAPS["filterMap"];
type CollectionFieldMap  = typeof COLLECTIONS_PROFILE_MAPS["fieldMap"];

// All profiles object type
export type CollectionProfiles = EndpointProfiles<CollectionFilterMap, CollectionFieldMap>;

// A single profile (e.g. CollectionS_PROFILES["getAll"])
export type CollectionProfileKey = keyof CollectionProfiles;
export type CollectionProfile = CollectionProfiles[CollectionProfileKey];

// Endpoint profiles (subsets of the above)
export const COLLECTIONS_PROFILES: CollectionProfiles = {
    getAll: {
        allowedSearchFields: ["name"],
        defaultSearchFields: ["name"], 
        allowedFilters: [
            "name", 
            "author",
            "createdAt"
        ], 
        allowedSort: COLLECTIONS_SORT_KEYS, 
        defaultSort: COLLECTIONS_DEFAULT_SORT_KEY, 
        pageLimits: COLLECTIONS_PAGE_LIMITS, 
        // optional: projection for public responses
        projection: ["_id", "name", "description", "Collections", "author", "createdAt"],
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
            "name", "description", "Collections", "createdAt"
        ],
        strictWhiteListing: true  
    }, 

    updateMe: {
        allowedBody: [
            "name", "description", "Collections", "createdAt"
        ],
        strictWhiteListing: true  
    }, 
};