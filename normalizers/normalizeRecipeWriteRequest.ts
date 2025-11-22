import { BaseProfile } from "../types/policy";

const { flattenTags } = require("../utils/tags");
const { normalizeRequest } = require("./normalizeRequest");

/**
 * Takes a create or update request payload and then parses out and sanitizes accepted search criteria.
 * 
 * @param {*} payload req.query for GET endpoints and req.body for POST endpoints
 * @param {*} profile Policy profile used for whitelisting
 * @returns     
 */
export const normalizeRecipeWriteRequest = (
    payload = {}, 
    profile = {} as BaseProfile
) => {
    const { clean, rejected } = normalizeRequest(payload, profile);

    // Calculate totalTimeMin
    let totalTimeMin = null;
    if (clean.prepTimeMin || clean.cookTimeMin || clean.restTimeMin) {
        totalTimeMin = 0;
        if (clean.prepTimeMin) totalTimeMin += clean.prepTimeMin;
        if (clean.cookTimeMin) totalTimeMin += clean.cookTimeMin;
        if (clean.restTimeMin) totalTimeMin += clean.restTimeMin;
    }
    clean.totalTimeMin = totalTimeMin;

    // Normalize Tags
    if (clean.tags) clean.tagsFlat = flattenTags(clean.tags);
    
    return { clean, rejected };
}