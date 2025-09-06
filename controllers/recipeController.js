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

exports.computeTotalCookTime = (req, res, next) => {
    const {
        prepTimeMin: prepRaw = 0,
        cookTimeMin: cookRaw = 0,
        restTimeMin: restRaw = 0,
    } = req.body;

    // Coerce to numbers
    const prepTimeMin = Number(prepRaw) || 0;
    const cookTimeMin = Number(cookRaw) || 0;
    const restTimeMin = Number(restRaw) || 0;

    req.body.totalTimeMin = prepTimeMin + cookTimeMin + restTimeMin;

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