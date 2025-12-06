import { EndpointProfiles } from "../types/policy";


// A single profile (e.g. feedbacks_PROFILES["getAll"])
export type feedbackProfileKey = keyof EndpointProfiles;
export type feedbackProfile = EndpointProfiles[feedbackProfileKey];

// Endpoint profiles (subsets of the above)
export const FEEDBACK_PROFILES: EndpointProfiles = {
    create: {
        // Body whitelist (for middleware/schema validation)
        allowedBody: [
            "message"
        ], 
        strictWhiteListing: true 
    }
};