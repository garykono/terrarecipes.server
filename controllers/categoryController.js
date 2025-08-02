const { getIndexedCategories } = require("./staticController");
const catchAsync = require("../utils/catchAsync");
const Recipe = require('../models/recipeModel')
const { ERROR_NAME, AppError } = require("../utils/appError");
const { buildRecipeSearchOptions } = require("../utils/searchUtils/searchBuilders");
const { searchDocuments } = require("../utils/searchUtils/searchExecution");
const { sanitizeQuery } = require("../utils/filtering/sanitizeQuery")

exports.getCategory = catchAsync(async (req, res, next) => {
    const { group, slug } = req.query;

    if (!group || !slug) {
        return next(new AppError(400, ERROR_NAME.PARAM_ERROR, 'Missing group and/or slug parameter!'));
    }
    
    const indexedCategories = await getIndexedCategories();

    const groupData = indexedCategories[group];
    if (!groupData) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no group with that name.`));
    }

    // Load the data for this category, including search terms
    const categoryInfo = groupData[slug];
    if (!categoryInfo) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no category in ${group} with that slug.`));
    }

    // Get all recipes for this category
    // Build search options based on category tags
    const searchOptions = buildRecipeSearchOptions({
        search: categoryInfo.searchTags[0],
        searchFields: "tags"
    });

    // Only allow the whitelisted query params
    const cleanedQuery = sanitizeQuery('Recipe', req.query);

    // Run the **same** search logic your /recipes endpoint uses
    const { results } = await searchDocuments(Recipe, searchOptions, cleanedQuery);


    res.status(200).json({
        status: 'success',
        data: {
            categoryInfo,
            recipes: results
        }
    });
});

