import { StandardIngredient } from "../../../types/standardized";
import { ConversionsMap } from "../types";

/**
 * Determines which immediate conversion to use.
 * 
 * @param ingredientInfo 
 * @param form 
 * @param useTrueValues 
 * @returns 
 */
export function pickCrossTable(
    ingredientInfo: StandardIngredient,
    form?: string | null,
    useTrueValues = false
): ConversionsMap {
    if (useTrueValues) {
        const tvForm = form ? ingredientInfo.conversions.trueValues?.[form] : undefined;
        if (tvForm) return tvForm;
        if (ingredientInfo.conversions.trueValues) return ingredientInfo.conversions.trueValues;
    }
    const cfForm = form ? ingredientInfo.conversions.crossConversionsByForm?.[form] : undefined;
    return cfForm ?? ingredientInfo.conversions.crossConversions;
}

// per 1 standardCountUnit, how many of [unit]
export function toStandardCount(ingredientInfo: StandardIngredient, amount: number, countUnit: string): number {
    if (!ingredientInfo.standardCountUnit) throw new Error(`No standardCountUnit for ${ingredientInfo.name}.`);
    if (countUnit === ingredientInfo.standardCountUnit) return amount;
    const factorPerStd = ingredientInfo.conversions.countConversions[countUnit];
    if (factorPerStd == null) throw new Error(`No count conversion for unit "${countUnit}".`);
    return amount / factorPerStd; // amt [unit] → stdCount
}

export function fromStandardCount(ingredientInfo: StandardIngredient, stdCount: number, targetCountUnit: string): number {
    if (!ingredientInfo.standardCountUnit) throw new Error(`No standardCountUnit for this ingredient.`);
    if (targetCountUnit === ingredientInfo.standardCountUnit) return stdCount;
    const factorPerStd = ingredientInfo.conversions.countConversions[targetCountUnit];
    if (factorPerStd == null) throw new Error(`No count conversion for unit "${targetCountUnit}".`);
    return stdCount * factorPerStd; // stdCount → target [unit]
}