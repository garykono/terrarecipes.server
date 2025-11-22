import { RecipeModel } from '../models/recipeModel';
const factory = require('./handlerFactory')

// export const aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

export const getAllRecipes = factory.getAll(RecipeModel);
export const getRecipe = factory.getOne(RecipeModel, [
    {
        path: 'author',
        select: 'username'
    }
]);
export const createRecipe = factory.createOne(RecipeModel);
export const updateRecipe = factory.updateOne(RecipeModel);
export const deleteRecipe = factory.deleteOne(RecipeModel);