const fs = require('fs/promises')
const path = require('path')
const catchAsync = require('../utils/catchAsync')
const { AppError, ERROR_NAME } = require('../utils/appError')
const { formatIngredients, formatMeasurementUnits, indexStandardizedList } = require('../utils/formatStandardizedData')

let cachedIngredients = null;
let cachedMeasurementUnits = null;
let cachedFlattenedIngredients = null;
let cachedFlattenedMeasurementUnits = null;
let cachedIngredientNameLookupTable = null;
let cachedMeasurementUnitsNameLookupTable = null;

exports.getFiles = catchAsync(async (req, res, next) => {
    const ingredientsPath = path.join(__dirname, '..', 'data', 'ingredients.json');
    const measurementUnitsPath = path.join(__dirname, '..', 'data', 'measurementUnits.json');

    if (!cachedIngredients || !cachedMeasurementUnits || !cachedFlattenedIngredients || !cachedFlattenedMeasurementUnits
        || !cachedIngredientNameLookupTable || !cachedMeasurementUnitsNameLookupTable
    ) {
        const [ingredientsData, measurementUnitsData] = await Promise.all([
                fs.readFile(ingredientsPath, 'utf-8'),
                fs.readFile(measurementUnitsPath, 'utf-8')
        ]);

        // Cache the original form of the data
        cachedIngredients = JSON.parse(ingredientsData);
        cachedMeasurementUnits = JSON.parse(measurementUnitsData);

        // Create a flattened version of the data for quick Lookups of additional data about an item
        cachedFlattenedIngredients = formatIngredients(cachedIngredients);
        cachedFlattenedMeasurementUnits = formatMeasurementUnits(cachedMeasurementUnits);

        // Create commonly used Lookup tables for extremely fast searching on clients
        cachedIngredientNameLookupTable = indexStandardizedList(cachedFlattenedIngredients);
        cachedMeasurementUnitsNameLookupTable = indexStandardizedList(cachedFlattenedMeasurementUnits);
    } 

    res.status(200).json({
        status: 'success',
        data: {
            standardIngredients: cachedFlattenedIngredients,
            standardMeasurements: cachedFlattenedMeasurementUnits,
            standardIngredientsLookupTable: cachedIngredientNameLookupTable,
            standardMeasurementsLookupTable: cachedMeasurementUnitsNameLookupTable,
            stardardIngredientsGroupedByCategory: cachedIngredients
        }
    });  
});