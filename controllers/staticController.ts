import { Request, Response, NextFunction } from "express"
import { Categories, CategorizedIngredientList, CategoryData, IndexedCategories, IngredientForms, IngredientPreparations, StandardIngredients, StandardLookupTable, StandardMeasurements, StandardMeasurementsList, StandardTags } from "../types/standardized"

import fs from 'fs/promises';
import path from 'path';
import catchAsync from '../utils/catchAsync';
import { AppError, ERROR_NAME } from '../utils/appError';
import { 
    formatIngredients, 
    formatMeasurementUnits, 
    indexStandardizedList, 
    indexCategories, 
    prepareCategoryData 
} from '../utils/formatStandardizedData';
import logger from "../utils/logger";

let cachedIngredients: CategorizedIngredientList | null = null;
let cachedMeasurementUnits: StandardMeasurementsList | null = null;
let cachedFormattedIngredients: StandardIngredients | null= null;
let cachedFormattedMeasurementUnits: StandardMeasurements | null = null;
let cachedIngredientNameLookupTable: StandardLookupTable | null = null;
let cachedMeasurementUnitsNameLookupTable: StandardLookupTable | null = null;
let cachedIngredientForms: IngredientForms | null = null;
let cachedIngredientPreparations: IngredientPreparations | null = null;
let cachedCategories: Categories | null = null;
// Indexed for fast look ups by slug on server side (ex. category controller)
let cachedIndexedCategories: IndexedCategories | null = null;
// Formatted category data to easily be used client side (ex. For a browse page)
let cachedCategoryData: CategoryData | null = null;
let cachedTags: StandardTags | null = null;

const ingredientsPath = path.join(__dirname, '..', 'data', 'ingredients.json');
const measurementUnitsPath = path.join(__dirname, '..', 'data', 'measurementUnits.json');
const ingredientFormsAndPreparationsPath = path.join(__dirname, '..', 'data', 'ingredient_forms_and_preparations.json');
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const tagsPath = path.join(__dirname, '..', 'data', 'tags.json');

export const getFiles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!cachedIngredients || !cachedMeasurementUnits || !cachedFormattedIngredients || !cachedFormattedMeasurementUnits
        || !cachedIngredientNameLookupTable || !cachedMeasurementUnitsNameLookupTable || !cachedIngredientForms 
        || !cachedIngredientPreparations || !cachedCategories || !cachedIndexedCategories || !cachedTags
    ) {
        const [ingredientsData, measurementUnitsData, ingredientFormsAndPreparationsData, tagsData] = await Promise.all([
                fs.readFile(ingredientsPath, 'utf-8'),
                fs.readFile(measurementUnitsPath, 'utf-8'),
                fs.readFile(ingredientFormsAndPreparationsPath, 'utf-8'),
                fs.readFile(tagsPath, 'utf-8')
        ]);

        // Cache the original form of the data
        cachedIngredients = JSON.parse(ingredientsData);
        cachedMeasurementUnits = JSON.parse(measurementUnitsData);

        // Create a formatted version of the data for quick Lookups of additional data about an item
        if (cachedIngredients) {
            cachedFormattedIngredients = formatIngredients(cachedIngredients);
        } else {
            logger.warn({ cachedIngredients }, "couldn't load file");
        }

        if (cachedMeasurementUnits) {
            cachedFormattedMeasurementUnits = formatMeasurementUnits(cachedMeasurementUnits);
        } else {
            logger.warn({ cachedMeasurementUnits }, "couldn't load file");
        }

        // Create commonly used Lookup tables for extremely fast searching on clients
        if (cachedFormattedIngredients) {
            cachedIngredientNameLookupTable = indexStandardizedList(cachedFormattedIngredients);
        } else {
            logger.warn({ cachedFormattedIngredients }, "couldn't load file");
        }
        
        if (cachedFormattedMeasurementUnits) {
            cachedMeasurementUnitsNameLookupTable = indexStandardizedList(cachedFormattedMeasurementUnits);
        } else {
            logger.warn({ cachedFormattedMeasurementUnits }, "couldn't load file");
        }

        // Different forms and preparations of ingredients that are commonly used in parsing
        const ingredientFormsAndPreparationsJson = JSON.parse(ingredientFormsAndPreparationsData);
        cachedIngredientForms = ingredientFormsAndPreparationsJson.forms;
        cachedIngredientPreparations = ingredientFormsAndPreparationsJson.preparations;

        // Pre-mapped categories
        await loadCategoryData();

        // Tags
        cachedTags = JSON.parse(tagsData);
    } 

    res.status(200).json({
        status: 'success',
        data: {
            standardIngredients: cachedFormattedIngredients,
            standardMeasurements: cachedFormattedMeasurementUnits,
            standardIngredientsLookupTable: cachedIngredientNameLookupTable,
            standardMeasurementsLookupTable: cachedMeasurementUnitsNameLookupTable,
            stardardIngredientsGroupedByCategory: cachedIngredients,
            ingredientForms: cachedIngredientForms,
            ingredientPreparations: cachedIngredientPreparations,
            categories: cachedCategoryData,
            tags: cachedTags,
        }
    });  
});

async function loadCategoryData() {
    cachedCategories = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'));
    if (cachedCategories) {
        cachedIndexedCategories = indexCategories(cachedCategories);
    } else {
        logger.warn({ cachedCategories }, "couldn't load file");
    }

    if (cachedIndexedCategories) {
        cachedCategoryData = prepareCategoryData(cachedIndexedCategories);
    } else {
        logger.warn({ cachedIndexedCategories }, "couldn't load file");
    }
}

export const getIndexedCategories = async () => {
    if (!cachedIndexedCategories) {
        await loadCategoryData();
    }
    return cachedIndexedCategories;
};