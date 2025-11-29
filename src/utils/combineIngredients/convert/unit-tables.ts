import { UnitConversionTable } from "../types";

export const unitConversionTable: UnitConversionTable = {
    // volume
    teaspoon: {
        tablespoon: 1 / 3,
        cup: 1 / 48,
        milliliter: 4.92892,
        "fluid ounce": 1 / 6  // 1 fl oz = 6 tsp
    },
    tablespoon: {
        teaspoon: 3,
        cup: 1 / 16,
        milliliter: 14.7868,
        "fluid ounce": 1 / 2  // 1 fl oz = 2 tbsp
    },
    cup: {
        teaspoon: 48,
        tablespoon: 16,
        milliliter: 240,
        "fluid ounce": 8  // 1 cup = 8 fl oz
    },
    milliliter: {
        teaspoon: 1 / 4.92892,
        tablespoon: 1 / 14.7868,
        cup: 1 / 240,
        "fluid ounce": 1 / 29.5735  // 1 fl oz = 29.5735 ml
    },
    liter: {
        milliliter: 1000,
        "fluid ounce": 1000 / 29.5735
    },
    "fluid ounce": {
        teaspoon: 6,
        tablespoon: 2,
        cup: 1 / 8,
        milliliter: 29.5735,
        liter: 1 / (1000 / 29.5735)
    },

    // weight
    gram: {
        kilogram: 0.001,
        ounce: 1 / 28.3495,
        pound: 1 / 453.592
    },
    kilogram: {
        gram: 1000
    },
    ounce: {
        gram: 28.3495,
        pound: 1 / 16
    },
    pound: {
        gram: 453.592,
        ounce: 16
    }
};