const fs = require('fs/promises')
const path = require('path')
const catchAsync = require('../utils/catchAsync')
const { AppError, ERROR_NAME } = require('../utils/appError')
const { formatIngredients, formatMeasurementUnits, indexStandardizedList } = require('../utils/formatStandardizedData')

let cachedIngredients = null;
let cachedMeasurementUnits = null;
let cachedFormattedIngredients = null;
let cachedFormattedMeasurementUnits = null;
let cachedIngredientNameLookupTable = null;
let cachedMeasurementUnitsNameLookupTable = null;
let cachedIngredientForms = null;
let cachedIngredientPreparations = null;

exports.getFiles = catchAsync(async (req, res, next) => {
    const ingredientsPath = path.join(__dirname, '..', 'data', 'ingredients.json');
    const measurementUnitsPath = path.join(__dirname, '..', 'data', 'measurementUnits.json');
    const ingredientFormsAndPreparationsPath = path.join(__dirname, '..', 'data', 'ingredient_forms_and_preparations.json');

    if (!cachedIngredients || !cachedMeasurementUnits || !cachedFormattedIngredients || !cachedFormattedMeasurementUnits
        || !cachedIngredientNameLookupTable || !cachedMeasurementUnitsNameLookupTable || !cachedIngredientForms 
        || !cachedIngredientPreparations
    ) {
        const [ingredientsData, measurementUnitsData, ingredientFormsAndPreparationsData] = await Promise.all([
                fs.readFile(ingredientsPath, 'utf-8'),
                fs.readFile(measurementUnitsPath, 'utf-8'),
                fs.readFile(ingredientFormsAndPreparationsPath, 'utf-8')
        ]);

        // Cache the original form of the data
        cachedIngredients = JSON.parse(ingredientsData);
        cachedMeasurementUnits = JSON.parse(measurementUnitsData);

        // Create a formatted version of the data for quick Lookups of additional data about an item
        cachedFormattedIngredients = formatIngredients(cachedIngredients);
        cachedFormattedMeasurementUnits = formatMeasurementUnits(cachedMeasurementUnits);

        // Create commonly used Lookup tables for extremely fast searching on clients
        cachedIngredientNameLookupTable = indexStandardizedList(cachedFormattedIngredients);
        cachedMeasurementUnitsNameLookupTable = indexStandardizedList(cachedFormattedMeasurementUnits);

        // Different forms and preparations of ingredients that are commonly used in parsing
        const ingredientFormsAndPreparationsJson = JSON.parse(ingredientFormsAndPreparationsData);
        cachedIngredientForms = ingredientFormsAndPreparationsJson.forms;
        cachedIngredientPreparations = ingredientFormsAndPreparationsJson.preparations;
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
            ingredientPreparations: cachedIngredientPreparations
        }
    });  
});