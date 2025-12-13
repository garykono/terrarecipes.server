import { Types } from "mongoose";

export const castValue = (v: any, type: string) => {
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
        case 'id': {
            // Already an ObjectId instance? return as is
            if (v instanceof Types.ObjectId) return v;

            // Acceptable forms: string or number convertible to string
            const s = String(v);

            // Validate
            if (!Types.ObjectId.isValid(s)) {
                throw new Error(`Expected valid ObjectId, got "${v}"`);
            }

            return new Types.ObjectId(s);
        }

        default:
            return String(v);
    }
}

export const castMany = (vals: any, type: string) => vals.map((v: any) => castValue(v, type));