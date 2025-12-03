import { EndpointProfiles } from "../types/policy";


// A single profile (e.g. groceryLists_PROFILES["getAll"])
export type groceryListProfileKey = keyof EndpointProfiles;
export type groceryListProfile = EndpointProfiles[groceryListProfileKey];

// Endpoint profiles (subsets of the above)
export const GROCERY_LIST_PROFILES: EndpointProfiles = {
    preview: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "recipeId", "collectionId"
        ], 
        strictWhiteListing: true 
    },

    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
        ], 
        strictWhiteListing: true 
    }, 

    update: {
        allowedBody: [
        ],
        strictWhiteListing: true  
    }, 
};