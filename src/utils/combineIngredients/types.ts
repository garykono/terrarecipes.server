import { Unit } from "./units";

export type Family = 'volume' | 'mass' | 'count';

export interface StandardUnit {
    name: string;
    type: Family
}

export interface ValidatedIngredient {
    standardConversionUnit: StandardUnit;
    mainCategory: string;
    requiredStandardQuantity: number;
    optionalStandardQuantity: number;
    hasArbitraryOptionalAmount: boolean;
}

export interface NormalizedIngredient extends ValidatedIngredient {
    normalizedRequiredUnitQuantity: number;
    normalizedOptionalUnitQuantity: number;
    normalizedUnit: Unit | null;
}

export interface NormalizedAndNamedIngredient extends NormalizedIngredient {
    name: string;
}

/* Conversions */
export type UnitConversionTable = {
    [from in Unit]?: {
        [to in Unit]?: number;
    };
};

export type ConversionsMap = Record<string, number>;

/* Thresholds */
export type DisplayThresholds = {
    [unit in Unit]?: { to: Unit; threshold: number }
};
