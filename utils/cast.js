exports.castValue = (v, type) => {
  if (v == null) return v;
  switch (type) {
    case 'number': {
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(n)) throw new Error(`Expected number, got "${v}"`);
      return n;
    }
    case 'date': {
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error(`Expected date, got "${v}"`);
      return d;
    }
    case 'boolean':
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
      throw new Error(`Expected boolean, got "${v}"`);
    default:
      return String(v);
  }
}

exports.castMany = (vals, type) => vals.map(v => castValue(v, type));