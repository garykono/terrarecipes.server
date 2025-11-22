// /combine/display/rules.ts
import { Unit } from '../units';

export type Category =
    "🥕 Vegetables" | "🍎 Fruits" | "🌾 Grains & Legumes" | "🥛 Dairy & Eggs" | "🍖 Meat & Seafood" | "🧂 Seasonings & Spices"
    | "🍞 Baking Ingredients" | "🫒 Oils & Vinegars" | "🍷 Wines" | "❓ Uncategorized"

export type DisplayPref = {
    preferred: Unit[];          // try in this order; first viable wins
    acceptable: Set<Unit>;      // safety rail; only show these
    preferCountWhenNatural?: boolean;
};

export const CATEGORY_RULES: Record<Category, DisplayPref> = {
    "🥕 Vegetables": {
        // Most produce is bought by piece or by weight (store scales show lb/kg).
        preferred: ['whole', 'pound', 'kilogram', 'gram'],
        acceptable: new Set(['whole','gram','kilogram','pound','ounce','milliliter','liter','cup','tablespoon','teaspoon']),
        preferCountWhenNatural: true
    },
    "🍎 Fruits": {
        // Same logic as vegetables.
        preferred: ['whole', 'pound', 'kilogram', 'gram'],
        acceptable: new Set(['whole','gram','kilogram','pound','ounce','milliliter','liter','cup','tablespoon','teaspoon']),
        preferCountWhenNatural: true
    },
    "🌾 Grains & Legumes": {
        // Usually bought by weight (bags/boxes); cups are recipe-facing, not shopping-facing.
        preferred: ['gram', 'kilogram', 'pound', 'ounce'],
        acceptable: new Set(['gram','kilogram','pound','ounce','cup','tablespoon','teaspoon','milliliter','liter'])
    },
    "🥛 Dairy & Eggs": {
        // Liquids (milk/cream/yogurt) by volume; cheeses often by weight; eggs by count via overrides.
        preferred: ['milliliter', 'liter', 'gram', 'kilogram'],
        acceptable: new Set(['milliliter','liter','gram','kilogram','cup','tablespoon','teaspoon','whole']),
        preferCountWhenNatural: true
    },
    "🍖 Meat & Seafood": {
        // Typically ordered by weight; pieces/fillets shown when natural.
        preferred: ['pound', 'kilogram', 'gram', 'whole'],
        acceptable: new Set(['pound','ounce','kilogram','gram','whole','piece','fillet','slice']),
        preferCountWhenNatural: true
    },
    "🧂 Seasonings & Spices": {
        // For shopping, spoons feel natural; grams as a precise fallback.
        preferred: ['teaspoon', 'tablespoon', 'gram'],
        acceptable: new Set(['teaspoon','tablespoon','gram','milliliter'])
    },
    "🍞 Baking Ingredients": {
        // Bakers buy by weight, but cups are common enough to allow as secondary.
        preferred: ['gram', 'kilogram', 'cup', 'tablespoon'],
        acceptable: new Set(['gram','kilogram','cup','tablespoon','teaspoon','milliliter','liter'])
    },
    "🫒 Oils & Vinegars": {
        // Bottles by volume; small totals often shown as tbsp.
        preferred: ['milliliter', 'liter', 'tablespoon', 'cup'],
        acceptable: new Set(['milliliter','liter','tablespoon','cup','teaspoon','fluid ounce'])
    },
    "🍷 Wines": {
        // Bottles by mL/L; fl oz acceptable; spoons are rare here.
        preferred: ['milliliter', 'liter', 'fluid ounce', 'cup'],
        acceptable: new Set(['milliliter','liter','fluid ounce','cup','tablespoon','teaspoon'])
    },
    "❓ Uncategorized": {
        // Safe, minimal defaults to avoid weird displays.
        preferred: ['whole', 'gram', 'milliliter'],
        acceptable: new Set(['whole','gram','kilogram','milliliter','liter','cup','tablespoon','teaspoon','pound','ounce'])
    }
};

// Optional per-ingredient overrides (examples)
export const INGREDIENT_OVERRIDES: Record<string, DisplayPref> = {
    // garlic: {
    //     preferred: ['clove', 'teaspoon', 'gram'],
    //     acceptable: new Set(['clove','head','teaspoon','tablespoon','gram'])
    // },
    // basil: {
    //     preferred: ['bunch', 'leaf', 'gram', 'cup', 'tablespoon'],
    //     acceptable: new Set(['bunch','leaf','sprig','gram','milliliter','cup','tablespoon'])
    // },
    // egg: {
    //     preferred: ['whole'],
    //     acceptable: new Set(['whole','gram'])
    // },
    // "onion soup mix": {
    //     preferred: ['packet', 'gram'],
    //     acceptable: new Set(['packet','gram','tablespoon'])
    // }
};