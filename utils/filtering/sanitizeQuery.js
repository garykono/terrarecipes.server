const { filterFields } = require('./filterFields');

/**
 * Strips out unapproved fields from a query object.
 * @param {string} modelName - The name of the model (e.g. 'Recipe')
 * @param {Object} query - The original req.query object
 * @returns {Object} - A sanitized query object
 */
exports.sanitizeQuery = (modelName, query) => {
    const allowed = filterFields[modelName] || [];
    return Object.fromEntries(
        Object.entries(query).filter(([key]) => allowed.includes(key))
    );
}