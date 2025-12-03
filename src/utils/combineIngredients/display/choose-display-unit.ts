import { Unit, isMassUnit, isVolumeUnit } from '../units';
import { CATEGORY_RULES, INGREDIENT_OVERRIDES, Category } from './rules';
import { convertSameType } from '../convert/convert-same-type';
import { StandardIngredient } from '../../../types/standardized';

export type Totals = {
    gram?: number;
    milliliter?: number;
    countStd?: number; // in ingredient.standardCountUnit
};

function stdCountTo(meta: StandardIngredient, stdCount: number, targetCountUnit: string): number | null {
    if (!meta.standardCountUnit) return null;
    if (targetCountUnit === meta.standardCountUnit) return stdCount;
    const factorPerStd = meta.conversions.countConversions?.[targetCountUnit];
    if (factorPerStd == null) return null;
    // stdCount [std] → target = stdCount * (target per 1 std)
    return stdCount * factorPerStd;
}

function hasAnchor(unit: Unit, totals: Totals, meta: StandardIngredient): boolean {
    if (isMassUnit(unit)) return totals.gram != null;
    if (isVolumeUnit(unit)) return totals.milliliter != null;
    // count
    return meta.standardCountUnit != null && totals.countStd != null;
}

// Heuristics to avoid weird-looking displays
function isSensible(unit: Unit, value: number): boolean {
    if (!isFinite(value)) return false;
    if (isMassUnit(unit) || isVolumeUnit(unit)) return value >= 0.01;
    // count-like: avoid tiny fractions like 0.1 whole
    return value >= 0.25;
}

function candidateValue(unit: Unit, totals: Totals, meta: StandardIngredient): number | null {
    if (isMassUnit(unit)) {
        if (totals.gram == null) return null;
        return unit === 'gram' ? totals.gram : convertSameType(totals.gram, 'gram', unit);
    }
    if (isVolumeUnit(unit)) {
        if (totals.milliliter == null) return null;
        return unit === 'milliliter' ? totals.milliliter : convertSameType(totals.milliliter, 'milliliter', unit);
    }
    // count
    if (totals.countStd == null || !meta.standardCountUnit) return null;
    const val = stdCountTo(meta, totals.countStd, unit);
    return val == null ? null : val;
}

/**
 * Translate the value and unit into something more readable (ex. if the amount of olive oil given is something like 42.3333 teaspoons,
 * it would be a lot more readable to translate it and then round it, like to tablespoons or cups).
 */
export function chooseDisplayUnit(meta: StandardIngredient, totals: Totals): { unit: Unit; value: number } {
    const override = INGREDIENT_OVERRIDES[meta.name.toLowerCase()];
    const rule = CATEGORY_RULES[meta.mainCategory as Category];
    const plan = override ? override.preferred : rule.preferred;
    const acceptable = override ? override.acceptable : rule.acceptable;

    for (const unit of plan) {
        if (!acceptable.has(unit)) continue;
        if (!hasAnchor(unit, totals, meta)) continue;
        const value = candidateValue(unit, totals, meta);
        if (value == null) continue;
        if (!isSensible(unit, value)) continue;
        return { unit, value };
    }

    // Fall back to anchors to avoid failure
    if (totals.gram != null) return { unit: 'gram', value: totals.gram };
    if (totals.milliliter != null) return { unit: 'milliliter', value: totals.milliliter };
    if (totals.countStd != null && meta.standardCountUnit) {
        return { unit: meta.standardCountUnit as Unit, value: totals.countStd };
    }

    throw new Error(`No viable display unit for ${meta.name}`);
}