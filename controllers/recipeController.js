const Recipe = require('../models/recipeModel')
const factory = require('./handlerFactory')
const { buildRecipeSearchOptions } = require('../utils/searchUtils/searchBuilders')

// exports.aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

exports.search = (req, res, next) => {
    req.options = buildRecipeSearchOptions(req.query);

    next();
}

exports.getAllRecipes = factory.getAll(Recipe);
exports.getRecipe = factory.getOne(Recipe, [
    {
        path: 'author',
        select: 'username'
    }
]);
exports.createRecipe = factory.createOne(Recipe);
exports.updateRecipe = factory.updateOne(Recipe);
exports.deleteRecipe = factory.deleteOne(Recipe);