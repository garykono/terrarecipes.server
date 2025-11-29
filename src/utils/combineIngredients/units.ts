import { Family } from "./types";

export const VOLUME_UNITS = ['teaspoon','tablespoon','cup','milliliter','liter','fluid ounce'] as const;
export const MASS_UNITS   = ['gram','kilogram','ounce','pound'] as const;
export const COUNT_UNITS  = ['whole','leaf','sprig','bunch','clove','slice','fillet','piece','ear','packet','knob'] as const;

export type VolumeUnit = typeof VOLUME_UNITS[number];
export type WeightUnit = typeof MASS_UNITS[number];
export type CountUnit  = typeof COUNT_UNITS[number];
export type Unit = VolumeUnit | WeightUnit | CountUnit | string;

export const VOL_UNITS_SET  = new Set<VolumeUnit>(VOLUME_UNITS);
export const MASS_UNITS_SET = new Set<WeightUnit>(MASS_UNITS);
export const COUNT_UNITS_SET = new Set<CountUnit>(COUNT_UNITS);

export function isVolumeUnit(u: unknown): u is VolumeUnit {
    return typeof u === 'string' && VOL_UNITS_SET.has(u as VolumeUnit);
}
export function isMassUnit(u: unknown): u is WeightUnit {
    return typeof u === 'string' && MASS_UNITS_SET.has(u as WeightUnit);
}
export function isCountUnit(u: unknown): boolean {
    // If you don’t keep a canonical list, treat anything not mass/volume as count
    return typeof u === 'string' && !isMassUnit(u) && !isVolumeUnit(u);
}

export function unitFamily(u: string): Family {
    if (isMassUnit(u)) return 'mass';
    if (isVolumeUnit(u)) return 'volume';
    return 'count';
}