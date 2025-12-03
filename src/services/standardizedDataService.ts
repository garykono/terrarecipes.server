import fs from "fs/promises";
import path from "path";
import logger from "../utils/logger";

import {
    Categories,
    CategorizedIngredientList,
    CategoryData,
    IndexedCategories,
    IngredientForms,
    IngredientPreparations,
    StandardIngredients,
    StandardLookupTable,
    StandardMeasurements,
    StandardMeasurementsList,
    StandardTags,
} from "../types/standardized";

import {
    formatIngredients,
    formatMeasurementUnits,
    indexStandardizedList,
    indexCategories,
    prepareCategoryData,
} from "../utils/formatStandardizedData";

const ingredientsPath = path.join(__dirname, "../..", "data", "ingredients.json");
const measurementUnitsPath = path.join(__dirname, "../..", "data", "measurementUnits.json");
const ingredientFormsAndPreparationsPath = path.join(
    __dirname,
    "../..",
    "data",
    "ingredient_forms_and_preparations.json"
);
const categoriesPath = path.join(__dirname, "../..", "data", "categories.json");
const tagsPath = path.join(__dirname, "../..", "data", "tags.json");

type StandardizedDataCache = {
    ingredients: CategorizedIngredientList | null;
    measurementUnits: StandardMeasurementsList | null;
    formattedIngredients: StandardIngredients | null;
    formattedMeasurementUnits: StandardMeasurements | null;
    ingredientNameLookupTable: StandardLookupTable | null;
    measurementUnitsNameLookupTable: StandardLookupTable | null;
    ingredientForms: IngredientForms | null;
    ingredientPreparations: IngredientPreparations | null;
    categories: Categories | null;
    indexedCategories: IndexedCategories | null;
    categoryData: CategoryData | null;
    tags: StandardTags | null;
};

const cache: StandardizedDataCache = {
    ingredients: null,
    measurementUnits: null,
    formattedIngredients: null,
    formattedMeasurementUnits: null,
    ingredientNameLookupTable: null,
    measurementUnitsNameLookupTable: null,
    ingredientForms: null,
    ingredientPreparations: null,
    categories: null,
    indexedCategories: null,
    categoryData: null,
    tags: null,
};

async function loadCategoryData() {
    const categoriesJson = await fs.readFile(categoriesPath, "utf-8");
    cache.categories = JSON.parse(categoriesJson);

    if (cache.categories) {
        cache.indexedCategories = indexCategories(cache.categories);
    } else {
        logger.warn({ categories: cache.categories }, "couldn't load categories");
    }

    if (cache.indexedCategories) {
        cache.categoryData = prepareCategoryData(cache.indexedCategories);
    } else {
        logger.warn({ indexedCategories: cache.indexedCategories }, "couldn't prepare category data");
    }
}

// Ensures *everything* is loaded
export async function ensureStandardizedDataLoaded() {
    if (
        cache.ingredients &&
        cache.measurementUnits &&
        cache.formattedIngredients &&
        cache.formattedMeasurementUnits &&
        cache.ingredientNameLookupTable &&
        cache.measurementUnitsNameLookupTable &&
        cache.ingredientForms &&
        cache.ingredientPreparations &&
        cache.categoryData &&
        cache.tags
    ) {
        return;
    }

    const [ingredientsData, measurementUnitsData, ingredientFormsAndPreparationsData, tagsData] =
        await Promise.all([
            fs.readFile(ingredientsPath, "utf-8"),
            fs.readFile(measurementUnitsPath, "utf-8"),
            fs.readFile(ingredientFormsAndPreparationsPath, "utf-8"),
            fs.readFile(tagsPath, "utf-8"),
        ]);

    // Base
    cache.ingredients = JSON.parse(ingredientsData);
    cache.measurementUnits = JSON.parse(measurementUnitsData);

    // Formatted
    if (cache.ingredients) {
        cache.formattedIngredients = formatIngredients(cache.ingredients);
    } else {
        logger.warn({ ingredients: cache.ingredients }, "couldn't load ingredients");
    }

    if (cache.measurementUnits) {
        cache.formattedMeasurementUnits = formatMeasurementUnits(cache.measurementUnits);
    } else {
        logger.warn({ measurementUnits: cache.measurementUnits }, "couldn't load measurement units");
    }

    // Lookup tables
    if (cache.formattedIngredients) {
        cache.ingredientNameLookupTable = indexStandardizedList(cache.formattedIngredients);
    } else {
        logger.warn(
            { formattedIngredients: cache.formattedIngredients },
            "couldn't create ingredient lookup table"
        );
    }

    if (cache.formattedMeasurementUnits) {
        cache.measurementUnitsNameLookupTable = indexStandardizedList(cache.formattedMeasurementUnits);
    } else {
        logger.warn(
            { formattedMeasurementUnits: cache.formattedMeasurementUnits },
            "couldn't create measurement lookup table"
        );
    }

    // Forms & preparations
    const ingredientFormsAndPreparationsJson = JSON.parse(ingredientFormsAndPreparationsData);
    cache.ingredientForms = ingredientFormsAndPreparationsJson.forms;
    cache.ingredientPreparations = ingredientFormsAndPreparationsJson.preparations;

    // Categories + categoryData
    await loadCategoryData();

    // Tags
    cache.tags = JSON.parse(tagsData);
}

// ---- Public getters ----

// For frontend calls
export async function getStandardizedData() {
    await ensureStandardizedDataLoaded();

    return {
        standardIngredients: cache.formattedIngredients,
        standardMeasurements: cache.formattedMeasurementUnits,
        standardIngredientsLookupTable: cache.ingredientNameLookupTable,
        standardMeasurementsLookupTable: cache.measurementUnitsNameLookupTable,
        standardIngredientsGroupedByCategory: cache.ingredients,
        ingredientForms: cache.ingredientForms,
        ingredientPreparations: cache.ingredientPreparations,
        categories: cache.categoryData,
        tags: cache.tags,
    };
}

// ---- Ingredient Data ----
export async function getStandardIngredients() {
  await ensureStandardizedDataLoaded();
  return cache.formattedIngredients; // StandardIngredients | null
}

export async function getStandardIngredientsRaw() {
  await ensureStandardizedDataLoaded();
  return cache.ingredients; // CategorizedIngredientList | null
}

export async function getIngredientLookupTable() {
  await ensureStandardizedDataLoaded();
  return cache.ingredientNameLookupTable; // StandardLookupTable | null
}

export async function getIngredientForms() {
  await ensureStandardizedDataLoaded();
  return cache.ingredientForms; // IngredientForms | null
}

export async function getIngredientPreparations() {
  await ensureStandardizedDataLoaded();
  return cache.ingredientPreparations; // IngredientPreparations | null
}


// ---- Measurement Units ----
export async function getStandardMeasurements() {
  await ensureStandardizedDataLoaded();
  return cache.formattedMeasurementUnits; // StandardMeasurements | null
}

export async function getStandardMeasurementsRaw() {
  await ensureStandardizedDataLoaded();
  return cache.measurementUnits; // StandardMeasurementsList | null
}

export async function getMeasurementLookupTable() {
  await ensureStandardizedDataLoaded();
  return cache.measurementUnitsNameLookupTable; // StandardLookupTable | null
}


// ---- Categories ----
export async function getCategories() {
    await ensureStandardizedDataLoaded();
    return cache.categories; // Categories | null
}

export async function getIndexedCategories() {
    await ensureStandardizedDataLoaded();
    return cache.indexedCategories; // IndexedCategories | null
}

export async function getCategoryData() {
    await ensureStandardizedDataLoaded();
    return cache.categoryData; // CategoryData | null
}


// ---- Tags ----
export async function getStandardTags() {
    await ensureStandardizedDataLoaded();
    return cache.tags; // StandardTags | null
}