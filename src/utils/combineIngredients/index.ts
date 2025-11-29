import { Ingredient } from "../../types/recipe";
import { StandardIngredient, StandardIngredients, StandardLookupTable, StandardMeasurement, StandardMeasurements } from "../../types/standardized";
import logger from "../logger";
import { convertAnyUnit } from "./convert/convert-any";
import { normalizeDisplayUnit } from "./display/normalize";
import { roundToCommonFraction } from "./display/roundToCommonFraction";
import { NormalizedAndNamedIngredient, NormalizedIngredient, StandardUnit, ValidatedIngredient } from "./types";
import { Unit } from "./units";

export interface CombinedIngredients {
    standardizedIngredients: {
        [key: string]: NormalizedIngredient
    },
    miscellaneous: string[]
}

export interface CombineIngredientsProps {
    uncombinedIngredients: Ingredient[]; 
    standardIngredients: StandardIngredients | null;
    standardIngredientsLookupTable: StandardLookupTable | null;
    standardMeasurements: StandardMeasurements | null;
    standardMeasurementsLookupTable: StandardLookupTable | null;
}

export function combineIngredients({ 
    uncombinedIngredients, 
    standardIngredients,
    standardIngredientsLookupTable,
    standardMeasurements,
    standardMeasurementsLookupTable
} : CombineIngredientsProps) {
    let successfulAttemptsToCombine = 0;
    let totalAttemptsToCombine = 0;

    // If tools for standardizing are missing, return a list of unparsed ingredient lines
    if (!standardIngredients || !standardIngredientsLookupTable || !standardMeasurements || !standardMeasurementsLookupTable) {
        logger.warn("Missing one or more standardized lists. All ingredients set to miscellaneous.")
        return {
            standardizedIngredients: {},
            miscellaneous: uncombinedIngredients.map(ingredient => ingredient.text)
        } as CombinedIngredients;
    }

    const validatedIngredients = {
        standardizedIngredients: {} as {
            [key: string]: ValidatedIngredient
        },
        miscellaneous: [] as string[]
    };

    uncombinedIngredients.forEach(ingredient => {
        totalAttemptsToCombine++;
        if (!ingredient.parsed) {
            logger.warn(`'${ingredient.text}' was never parsed. Try to parse in future, but for now, adding to miscellaneous list.`);
            validatedIngredients.miscellaneous.push(ingredient.text);
            return;
        }
        
        ingredient.parsed.forEach(parsedIngredient => {
            logger.debug({ ingredientToBeCombined: parsedIngredient })
            let parsedQuantity = parsedIngredient.quantity;
            const parsedUnit = parsedIngredient.unit;
            const parsedIngredientName = parsedIngredient.ingredient;
            const parsedIngredientRawText = parsedIngredient.raw;
            const isOptional = parsedIngredient.isOptional ? true : false;
            const isSubstitute = parsedIngredient.isSubstitute;
            const optionalQuantity = parsedIngredient.optionalQuantity;

            // Ignore substitutions for now
            if (isSubstitute) return

            // Get the ingredient's standard name
            const standardName = standardIngredientsLookupTable[parsedIngredientName];

            if (!standardName) {
                logger.debug("Couldn't find ingredient name (including its aliases) in standardized list. Adding to miscellaneous.")
                validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                return;
            }

            let convertedUnitAmount = 0;
            if (!parsedIngredientName) {
                logger.debug(`This ingredient is missing a parsed field: 'name', so no conversion possible. Adding to miscellaneous ingredients`)
                validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                return;
            }
            if (!parsedQuantity) {
                if (!optionalQuantity) {
                    logger.debug(`This ingredient is missing a parsed field: 'quantity' and is not an optional ingredient, so unable to convert. Adding to miscellaneous ingredients.`)
                    validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                    return;    
                } else {
                    parsedQuantity = 0;
                }
            }

            // Get the ingredient's standard measurement unit
            const ingredientInfo = standardIngredients[standardName];
            logger.debug({ standardIngredientInfo: ingredientInfo });
            
            const standardConversionUnitName = standardMeasurementsLookupTable[ingredientInfo.standardConversionUnit];
            const standardConversionUnitInfo = standardMeasurements[standardConversionUnitName];
            /* This is the unit that all instances of this ingredient in the uncombined ingredients list will be converted -TO-
            in order to combine them */
            let standardConversionUnit : StandardUnit;
            
            if (standardConversionUnitName && standardConversionUnitInfo) {
                standardConversionUnit = {
                    name: standardConversionUnitName,
                    type: standardConversionUnitInfo.type
                }
            } else {
                logger.debug({ standardConversionUnitName, standardConversionUnitInfo },
                    `Couldn't derive a standard conversion unit from ${parsedIngredientName} so no conversion possible.
                    Adding to miscellaneous ingredients.`
                );
                validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                return;
            } 

            // Get the ingredient's main category
            const mainCategory = ingredientInfo.mainCategory;
            
            // Do a lookup to get the parsed measurement unit's standard name
            // This is the unit that we are converting -FROM- for this instance of the ingredient
            let standardNameOfParsedUnit: Unit | undefined;
            // If the quantity is optional, then this ingredient will not need a conversion
            if (!optionalQuantity) {
                if (parsedUnit) {
                    standardNameOfParsedUnit = standardMeasurementsLookupTable[parsedUnit]
                } else {  
                    standardNameOfParsedUnit = "whole";
                } 

                
                // Convert ounce to fluid ounce in the case that that is what this ingredient should default to
                if (standardNameOfParsedUnit === "ounce" && ingredientInfo.treatOuncesAsVolume) {
                    standardNameOfParsedUnit = "fluid ounce";
                }

                // Derive a fully standardized unit (with its type, ex. "mass" or "volume") from the parsed unit
                let standardParsedUnitMeasurementInfo: StandardMeasurement| undefined = standardMeasurements[standardNameOfParsedUnit];

                let standardParsedUnit : StandardUnit;
                if (standardNameOfParsedUnit && standardParsedUnitMeasurementInfo) {
                    standardParsedUnit = {
                        name: standardParsedUnitMeasurementInfo.name,
                        type: standardParsedUnitMeasurementInfo.type
                    }
                } else {
                    logger.debug("Could not find a standardized unit match for parsed unit. Adding to miscellaneous.");
                    validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                    return;
                }

                // convert to standard unit
                logger.debug({ standardUnit: standardParsedUnit });
                try {
                    convertedUnitAmount = convertAnyUnit(parsedQuantity, standardParsedUnit, standardConversionUnit, ingredientInfo);
                    logger.debug(`conversion successful.`);
                } catch (e) {
                    logger.debug({ error: e }, "Failed to convert. Adding to miscellaneous.");
                    validatedIngredients.miscellaneous.push(parsedIngredientRawText);
                    return;
                } 
            }

            // Calculate the standard quantity
            const validatedAndStandardizedIngredientsList = validatedIngredients.standardizedIngredients;
            if (!validatedAndStandardizedIngredientsList[standardName]) {
                validatedAndStandardizedIngredientsList[standardName] = {
                    standardConversionUnit,
                    mainCategory,
                    requiredStandardQuantity: 0,
                    optionalStandardQuantity: 0,
                    hasArbitraryOptionalAmount: false
                }
            }
            const previousStandardUnitAmount = isOptional 
                ?  validatedAndStandardizedIngredientsList[standardName].optionalStandardQuantity
                : validatedAndStandardizedIngredientsList[standardName].requiredStandardQuantity;
            const updatedStandardUnitAmount = previousStandardUnitAmount + convertedUnitAmount;

            if (optionalQuantity) validatedAndStandardizedIngredientsList[standardName].hasArbitraryOptionalAmount = true;

            // Add/update entry for ingredient in appropriate list
            validatedAndStandardizedIngredientsList[standardName][isOptional ? 'optionalStandardQuantity' : 'requiredStandardQuantity'] = 
                updatedStandardUnitAmount;

            successfulAttemptsToCombine++;
            logger.debug(
                { 
                    ingredientName: parsedIngredientName, 
                    listAddedTo: isOptional ? "optional" : "validated",
                    previousQuantityInThisList: previousStandardUnitAmount,
                    newQuantityInThisList: updatedStandardUnitAmount
                }, "ingredient successfully combined to grocery list"
            );
        })
    })
    
    // For each standardized ingredient, if the quantity is large for the standard unit, convert to a larger unit
    const combinedIngredients = {
        standardizedIngredients: {},
        miscellaneous: []
    } as CombinedIngredients;

    // Normalize and add standardized ingredients
    Object.keys(validatedIngredients.standardizedIngredients).forEach(ingredientName => {
        const validatedIngredient = validatedIngredients.standardizedIngredients[ingredientName];
        const listAddedTo = combinedIngredients.standardizedIngredients;
        normalizeAndAddStandardizedIngredient(standardIngredients[ingredientName], validatedIngredient, standardMeasurements, listAddedTo)
    })

    // Copy miscellaneous ingredients array
    combinedIngredients.miscellaneous = [...validatedIngredients.miscellaneous];

    logger.debug(
        {
            finalCombinedIngredientsList: combinedIngredients,
            numberOfSuccessfullyParsedAndCombinedIngredients: successfulAttemptsToCombine,
            numberOfAttemptedToCombineIngredients: totalAttemptsToCombine
        },
        `% of attempts successful: ${Math.round(successfulAttemptsToCombine / totalAttemptsToCombine * 100)}%`,
    );

    return combinedIngredients;
}

function normalizeAndAddStandardizedIngredient(
    ingredientInfo: StandardIngredient, 
    validatedIngredient: ValidatedIngredient, 
    standardMeasurements: StandardMeasurements,
    listAddedTo: {
        [key: string]: {}
    }
) {
    // Get normalization quantity and unit for the required amount and then round it
    const { normalizedUnitQuantity, normalizedUnit } = normalizeDisplayUnit(
        ingredientInfo,
        validatedIngredient.requiredStandardQuantity
    );

    // For the optional amount, if there is a normalized unit from the required amount, then convert to optional amount to that unit
    const normalizedRequiredUnitQuantity = convertAnyUnit(
        validatedIngredient.optionalStandardQuantity, 
        validatedIngredient.standardConversionUnit, 
        {
            name: normalizedUnit,
            type: standardMeasurements[normalizedUnit].type
        }, 
        ingredientInfo
    );

    // Rounding for display
    const normalizedAndRoundedUnitQuantity = normalizedUnitQuantity >= 1 
        ? roundToCommonFraction(normalizedUnitQuantity)
        : normalizedUnitQuantity;
    const normalizedOptionalUnitQuantity = normalizedRequiredUnitQuantity >= 1 
        ? roundToCommonFraction(normalizedRequiredUnitQuantity)
        : normalizedRequiredUnitQuantity;

    logger.debug(`${ingredientInfo.name} normalization: 
            ${validatedIngredient.requiredStandardQuantity} ${validatedIngredient.standardConversionUnit} => ${normalizedUnitQuantity} ${normalizedUnit}`);
    listAddedTo[ingredientInfo.name] = {
        ...validatedIngredient,
        normalizedRequiredUnitQuantity: normalizedAndRoundedUnitQuantity,
        normalizedOptionalUnitQuantity,
        normalizedUnit: normalizedUnit
    }
}

export interface CategorizedAndCombinedIngredients {
    //category
    standardizedIngredients: {
        // Category
        [key: string]: NormalizedAndNamedIngredient[]
    };
    miscellaneousIngredients: string[];
}

export function categorizeAndCombineIngredients(combinedIngredients: CombinedIngredients) {
    const categorizedAndCombinedIngredients = {
        standardizedIngredients: {}
    } as CategorizedAndCombinedIngredients;
    Object.keys(combinedIngredients.standardizedIngredients).forEach(ingredientName => {
        const ingredientData = combinedIngredients.standardizedIngredients[ingredientName];
        const category = ingredientData.mainCategory;
        if (!categorizedAndCombinedIngredients.standardizedIngredients[category]) {
            categorizedAndCombinedIngredients.standardizedIngredients[category] = [];
        }

        categorizedAndCombinedIngredients.standardizedIngredients[category].push({
            ...ingredientData,
            name: ingredientName,
        })
    })
    categorizedAndCombinedIngredients.miscellaneousIngredients = combinedIngredients.miscellaneous;
    return categorizedAndCombinedIngredients;
}







