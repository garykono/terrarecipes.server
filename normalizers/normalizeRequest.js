const { AppError, ERROR_NAME } = require("../utils/appError");
const { getMissingFields } = require("../utils/helpers");
const { logger } = require("../utils/logger");

/**
 * Takes a create or update request payload and then parses out and sanitizes accepted search criteria.
 * 
 * @param {*} payload req.query for GET endpoints and req.body for POST endpoints
 * @param {*} profile Policy profile used for whitelisting
 * @returns     
 */
exports.normalizeRequest = (
    payload = {}, 
    profile = {}
) => {
    const allowedFields =  profile.allowedBody ? new Set(profile.allowedBody) : new Set([]);
    const strict = !!profile.strictWhiteListing ? profile.strictWhiteListing : true;
    
    // Whitelist fields
    const clean = {};
    const rejected = {};

    for (const [key, value] of Object.entries(payload)) {
        logger.debug({ key, value, inAllowedFields: allowedFields.has(key) }, "whitelist attempt on a user variable")
        if (allowedFields.has(key)) {
            clean[key] = value;
        } else {
            rejected[key] = value;
        }
    }

    if (strict && Object.keys(rejected).length > 0) {
        throw new AppError(400, ERROR_NAME.INVALID_FIELDS_ERROR, `Non-whitelisted fields detected: ${Object.keys(rejected).join(', ')}`);
    }

    // Check that required fields specified. For now let mongoose handle it.
    // if (profile.requiredFields) {
    //     const missing = getMissingFields(clean, profile.requiredFields);
    //     if (missing.length) {
    //         throw new AppError(
    //             400,
    //             'VALIDATION_ERROR',
    //             `Missing required fields: ${missing.join(', ')}`
    //         );
    //     }
    // }

    return { clean, rejected };
}