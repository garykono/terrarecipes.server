const Recipe = require('../models/recipeModel')
const APIFeatures = require('../utils/apiFeatures')
const { buildSearchFilter, buildMatchScoreField } = require('../utils/searchUtils')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

// exports.aliasNewRecipes = (req, res, next) => {
//     req.query.limit = '5';
//     req.query.sort = '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();
// }

exports.search = (req, res, next) => {
    const { page, sort, search, searchFields } = req.query;

    const searchFieldArray = !!searchFields ? searchFields.split(",") : [];

    const filter = [];
    let addFields = {};
    let sortBy = sort;

    const isPaginated = !!page;
    const multiFieldSearch = !!searchFieldArray && searchFieldArray.length !== 1;
    const advancedSearch = !!search && multiFieldSearch;

    const useAggregate = isPaginated || advancedSearch;

    if (search) {
        const searchTerm = search.trim().replace('-', ' ');
        const regex = new RegExp(`\\b${searchTerm}\\b`, 'i');

        filter.push({
            $or: buildSearchFilter(regex, searchFieldArray)
        })

        if (useAggregate) {
            addFields.matchScore = buildMatchScoreField(regex);
        }

        if (!sort && advancedSearch) {
            sortBy = "-matchScore";
        }

        // Use something like this when I want to do a search for recipes that meet a quantity requirement for an ingredient 
        // (<2 cups diced tomatoes). maybe make a separate controller function or endpoint for this?
        // if (minQuantity || maxQuantity) {
        //     const rangeFilter = {};
        //     if (minQuantity) rangeFilter.$gte = Number(minQuantity);
        //     if (maxQuantity) rangeFilter.$lte = Number(maxQuantity);
        //     filter.push({ quantity: rangeFilter });
        // }
    }

    console.log("sortBy:", sortBy)

    req.options = {
        customFilter: filter.length ? { $and: filter } : {},
        addFields,
        useAggregate,
        sortBy
    };

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