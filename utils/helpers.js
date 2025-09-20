exports.toArray = (v) =>
    Array.isArray(v) ? v : String(v ?? "").split(",").map(s => s.trim()).filter(Boolean);

exports.isPlainObject = (v) =>
  v && typeof v === 'object' && !Array.isArray(v);