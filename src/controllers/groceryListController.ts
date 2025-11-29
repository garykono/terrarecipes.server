import { Request, Response, NextFunction } from "express";
import { AppError, ERROR_NAME } from "../utils/appError";
import { RecipeDoc, RecipeModel } from "../models/recipeModel";
import { CollectionDoc, CollectionModel } from "../models/collectionModel";

import catchAsync from "../utils/catchAsync";
import { Recipe } from "../types/recipe";
import { categorizeAndCombineIngredients, combineIngredients } from "../utils/combineIngredients";
import { getStandardIngredients, getStandardizedData } from "../services/standardizedDataService";

export const previewGroceryList = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { recipeId, collectionId } = req.parsed;

    const hasRecipe = recipeId !== undefined;
    const hasCollection = collectionId !== undefined;

    if (hasRecipe === hasCollection) {
        // either both true or both false → invalid
        return next(new AppError(400, ERROR_NAME.INVALID_FIELDS_ERROR, "A grocery list requires either one recipe or one collection, not both nor neither."));
    }


    // Derive all recipes from sources
    let recipeDoc: RecipeDoc | null = null;
    let collectionDoc: CollectionDoc | null = null;
    let name: string | null = null;
    let recipes: Recipe[] = [];

    if (hasRecipe) {
        recipeDoc = await (RecipeModel.findById(recipeId)) as RecipeDoc | null;
        if (!recipeDoc) {
            return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No recipe found with that ID'));
        }
        name = recipeDoc.name;
        recipes = [recipeDoc as unknown as Recipe];
    } else {
        // Derive collection recipes from sources
        collectionDoc = await CollectionModel.findById(collectionId).populate([
            { 
                path: 'recipes', 
                select: '-__v -description -directions'
            }
        ]) as CollectionDoc;

        if (!collectionDoc) {
            return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No collection found with that ID'));
        }
        name = collectionDoc.name;
        recipes = collectionDoc.recipes as unknown as Recipe[];
    }
    
    // (IN FUTURE) Find all individual recipes and recipes from collections and add their ingredients to one list

    // Load all standardized lists required for combining recipes
    const { standardIngredients, standardIngredientsLookupTable, standardMeasurements, standardMeasurementsLookupTable } = await getStandardizedData();

    // Combine similar ingredients
    const uncombinedIngredientsList = recipes.flatMap(recipe => {
        return recipe.ingredients.filter(ingredient => !ingredient.isSection)
    });

    const combinedIngredients = combineIngredients({ 
        uncombinedIngredients: uncombinedIngredientsList, 
        standardIngredients,
        standardIngredientsLookupTable,
        standardMeasurements,
        standardMeasurementsLookupTable
    });
    
    // (optional) Break the ingredients into categories
    const categorizedAndCombinedIngredients = categorizeAndCombineIngredients(combinedIngredients)
    

    // Build the grocery list


    res.status(200).json({
        status: 'success',
        data: {
            name,
            categorizedIngredients: categorizedAndCombinedIngredients
        }
    });
});