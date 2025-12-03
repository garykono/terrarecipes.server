import { Unit } from "../units";
import { unitConversionTable } from "./unit-tables";

/**
 * Convert an amount from one unit to another of the same unit class (ex. a mass to mass conversion such as grams to pounds).
 */
export function convertSameType(amount: number, from: Unit, to: Unit): number {
    if (from === to) return amount;

    const direct = unitConversionTable[from]?.[to];
    if (direct) return amount * direct;

    // Try indirect path (e.g., tbsp → ml → cup)
    const intermediates = unitConversionTable[from];
    if (!intermediates) throw new Error(`No conversion path from ${from}`);

    for (const intermediate in intermediates) {
        const midUnit = intermediate as Unit;
        const toMid = unitConversionTable[from]?.[midUnit];
        const fromMid = unitConversionTable[midUnit]?.[to];
        if (toMid && fromMid) {
            return amount * toMid * fromMid;
        }
    }

    throw new Error(`No conversion path from ${from} to ${to}`);
}