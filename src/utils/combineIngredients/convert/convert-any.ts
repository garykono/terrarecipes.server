import { StandardIngredient } from "../../../types/standardized";
import { StandardUnit } from "../types";
import { Unit } from "../units";
import { convertSameType } from "./convert-same-type";
import { fromStandardCount, pickCrossTable, toStandardCount } from "./ingredient-cross";
import logger from "../../logger";

/**
 * Convert a value from one standardized unit to another, using standardized ingredient info to provide conversion rates, 
 * allowed conversions, etc. This can even be conversions from one unit class to another, such as a mass to volume conversion if the 
 * standard ingredient provides the conversion for it.
 * 
 * @param amount The raw quantity of the unit being converted from.
 * @param from The StandardUnit of what is being converted from.
 * @param to The StandardUnit of what is being converted to.
 * @param ingredientInfo A StandardIngredient that provides info such as conversion rates.
 * @param options
 * @returns 
 */
export function convertAnyUnit(
    amount: number, 
    from: StandardUnit, 
    to: StandardUnit,
    ingredientInfo: StandardIngredient, 
    options?: {
        form?: string | null;
        useTrueValues?: boolean;
    }
): number {
    const form = options?.form ?? null;
    const useTrueValues = options?.useTrueValues ?? false;

    logger.debug(`converting from ${from.name} (${from.type}) --> ${to.name} (${to.type})`);
    
    if (from.name === to.name && from.type === to.type) return amount;

    // If the types are similar, then as long as the they aren't a count type, use convertSameType
    if (from.type === to.type) {
        if (from.type === "count") {
            const stdCount = toStandardCount(ingredientInfo, amount, from.name);
            return fromStandardCount(ingredientInfo, stdCount, to.name);
        } else {
            return convertSameType(amount, from.name as Unit, to.name as Unit);
        }
    } 

    // Convert the unit to the anchors (gram for mass, milliliter for volume, or the ingredient's "standardCountUnit" for count)
    // cross-family: normalize to anchors
    const cross = pickCrossTable(ingredientInfo, form, useTrueValues);
    const gPerStdDisp = cross['gram'];
    const mlPerStdDisp = cross['milliliter'];

    let stdCount: number | null = null;
    let grams: number | null = null;
    let mls: number | null = null;

    // normalize FROM
    if (from.type === 'count') {
        stdCount = toStandardCount(ingredientInfo, amount, from.name);
        if (typeof gPerStdDisp === 'number') grams = stdCount * gPerStdDisp;
        if (typeof mlPerStdDisp === 'number') mls   = stdCount * mlPerStdDisp;
    } else if (from.type === 'mass') {
        grams = (from.name === 'gram') ? amount : convertSameType(amount, from.name as Unit, 'gram');
        if (typeof gPerStdDisp === 'number' && gPerStdDisp !== 0) stdCount = grams / gPerStdDisp;
        if (stdCount != null && typeof mlPerStdDisp === 'number') mls = stdCount * mlPerStdDisp;
    } else { // from volume
        mls = (from.name === 'milliliter') ? amount : convertSameType(amount, from.name as Unit, 'milliliter');
        if (typeof mlPerStdDisp === 'number' && mlPerStdDisp !== 0) stdCount = mls / mlPerStdDisp;
        if (stdCount != null && typeof gPerStdDisp === 'number') grams = stdCount * gPerStdDisp;
    }

    // produce TO
    if (to.type === 'count') {
        if (stdCount == null) {
            if (!ingredientInfo.standardCountUnit) throw new Error(`Cannot convert to count for this ingredient.`);
            if (grams != null && typeof gPerStdDisp === 'number' && gPerStdDisp !== 0) stdCount = grams / gPerStdDisp;
            else if (mls != null && typeof mlPerStdDisp === 'number' && mlPerStdDisp !== 0) stdCount = mls / mlPerStdDisp;
            else throw new Error(`No path to count (missing anchors).`);
        }
        return fromStandardCount(ingredientInfo, stdCount, to.name);
    }

    if (to.type === 'mass') {
        if (grams == null) {
            if (stdCount != null && typeof gPerStdDisp === 'number') grams = stdCount * gPerStdDisp;
            else if (mls != null && typeof gPerStdDisp === 'number' && typeof mlPerStdDisp === 'number' && mlPerStdDisp !== 0) {
                const cs = mls / mlPerStdDisp;
                grams = cs * gPerStdDisp;
            } else throw new Error(`No path to grams.`);
        }
        return (to.name === 'gram') ? grams : convertSameType(grams, 'gram', to.name as Unit);
    }

    // to.type === 'volume'
    if (mls == null) {
        if (stdCount != null && typeof mlPerStdDisp === 'number') mls = stdCount * mlPerStdDisp;
        else if (grams != null && typeof gPerStdDisp === 'number' && gPerStdDisp !== 0 && typeof mlPerStdDisp === 'number') {
            const cs = grams / gPerStdDisp;
            mls = cs * mlPerStdDisp;
        } else throw new Error(`No path to milliliters.`);
    }
    return (to.name === 'milliliter') ? mls : convertSameType(mls, 'milliliter', to.name as Unit);

}