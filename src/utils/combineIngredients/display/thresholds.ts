import { DisplayThresholds } from "../types";

/*
    Thresholds where a unit will start to look strange to a user if not converted into another unit (ex. 3 tablespoons likely looks
    better than 9 teaspoons)
*/

export const unitDisplayThresholds: DisplayThresholds = {
    // volume
    milliliter: { to: 'teaspoon', threshold: 5 },
    teaspoon:   { to: 'tablespoon', threshold: 3 },
    tablespoon: { to: 'fluid ounce', threshold: 2 },
    'fluid ounce': { to: 'cup', threshold: 8 },
    cup:        { to: 'liter', threshold: 4 },

    // mass (US-first)
    gram:       { to: 'ounce', threshold: 28.3495 }, // 1 oz
    ounce:      { to: 'pound', threshold: 16 }       // 16 oz
};

export const unitDowngradeThresholds: DisplayThresholds = {
    // volume (reverse)
    liter:        { to: 'cup', threshold: 1 },
    cup:          { to: 'fluid ounce', threshold: 1 },
    'fluid ounce':{ to: 'tablespoon', threshold: 1 },
    tablespoon:   { to: 'teaspoon', threshold: 1 },
    teaspoon:     { to: 'milliliter', threshold: 1 },

    // mass (US-first reverse)
    pound:        { to: 'ounce', threshold: 1 },     // <1 lb → oz
    ounce:        { to: 'gram', threshold: 1 }       // <1 oz → g
};