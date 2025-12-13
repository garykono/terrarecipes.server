import { Request, Response, NextFunction } from 'express';
import { RecipeModel } from '../models/recipeModel';
import { createOne, deleteOne, getAll, getOne, updateOne } from './handlerFactory';

// export const aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

export const addIdMatchSearchCondition = (req: Request, res: Response, next: NextFunction) => {
    req.query = {
        ...req.query,
        author: req.user.id
    }
   
    next();
};

export const getAllRecipes = getAll(RecipeModel);
export const getRecipe = getOne(RecipeModel, [
    {
        path: 'author',
        select: 'username'
    }
]);
export const createRecipe = createOne(RecipeModel);
export const updateRecipe = updateOne(RecipeModel);
export const deleteRecipe = deleteOne(RecipeModel);