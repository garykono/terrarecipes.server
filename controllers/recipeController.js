const Recipe = require('../models/recipeModel')
const factory = require('./handlerFactory')
const { flattenTags } = require('../utils/tags');
const { compileRecipeSearch } = require('../utils/searchUtils/builders/recipeBuilders');

// exports.aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

exports.buildRecipeSearch = (req, res, next) => {
    req.options = compileRecipeSearch(req.parsed);

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