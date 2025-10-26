exports.toArray = (v) =>
    Array.isArray(v) ? v : String(v ?? "").split(",").map(s => s.trim()).filter(Boolean);

exports.isPlainObject = (v) =>
  v && typeof v === 'object' && !Array.isArray(v);

/**
 * Checks that all required fields exist and are non-empty (not null/undefined).
 * @param {Object} payload - The incoming data
 * @param {string[]} requiredFields - List of required field names
 * @returns {string[]} - Array of missing field names (empty if all present)
 */
exports.getMissingFields = (payload = {}, requiredFields = []) => {
  return requiredFields.filter(
    (field) =>
      !(field in payload) ||
      payload[field] === undefined ||
      payload[field] === null ||
      payload[field] === ''
  );
}