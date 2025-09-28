const Recipe = require('../models/recipeModel')
const factory = require('./handlerFactory')
const { flattenTags } = require('../utils/tags');
const { compileRecipeSearch } = require('../utils/searchUtils/builders/recipeBuilders');
const { normalizeSearchRequest } = require('../utils/searchUtils/parsers/normalizeSearchRequest');
const { RECIPES_PROFILES } = require('../policy/recipes.policy');

// exports.aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

exports.parseRecipeSearchQuery = (profileKey = "getAll") => (req, res, next) => {  
    const profile = RECIPES_PROFILES[profileKey];
    if (!profile) throw new Error(`Unknown recipes profile: ${profileKey}`);

    const payload = req.method === 'GET' ? (req.query || {}) : (req.body || {});

    const normalized = normalizeSearchRequest(payload, profile);

    req.parsed = {
        profileKey,
        ...normalized            // search, searchMode, searchFields, filters, sort, page, limit
    };

    next();
}

exports.buildRecipeSearch = (req, res, next) => {
    req.options = compileRecipeSearch(req.parsed);

    next();
}

exports.computeTotalCookTime = (req, res, next) => {
    const {
        prepTimeMin,
        cookTimeMin,
        restTimeMin,
    } = req.body;

    let totalTimeMin = null;
    if (prepTimeMin || cookTimeMin || restTimeMin) {
        totalTimeMin = 0;
        if (prepTimeMin) totalTimeMin += prepTimeMin;
        if (cookTimeMin) totalTimeMin += cookTimeMin;
        if (restTimeMin) totalTimeMin += restTimeMin;
    }

    req.body.totalTimeMin = totalTimeMin;

    next();
}

exports.normalizeTags = (req, res, next) => {
    const tags = req.body.tags;
    if (tags) {
        req.body.tagsFlat = flattenTags(tags);
    }
    next();
};

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