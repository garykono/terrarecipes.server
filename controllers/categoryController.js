const { getIndexedCategories } = require("./staticController");
const catchAsync = require("../utils/catchAsync");
const Recipe = require('../models/recipeModel')
const { ERROR_NAME, AppError } = require("../utils/appError");
const { searchDocuments } = require("../utils/searchUtils/searchExecution");
const { compileRecipeSearch } = require("../utils/searchUtils/builders/recipeBuilders");
const { RECIPES_PROFILES } = require("../policy/recipes.policy");
const { normalizeSearchRequest } = require("../utils/searchUtils/parsers/normalizeSearchRequest");

exports.getCategory = catchAsync(async (req, res, next) => {
    const { group, slug } = req.query;
    // This is essentially just using the getAll recipes pipeline, so use its profile
    const profileKey = "getAll";
    const profile = RECIPES_PROFILES[profileKey];

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

    console.log("category info: ", categoryInfo)

    const mainCategorySearchCriteria = categoryInfo.searchCriteria;
    
    // Go through the searching process for each subcategory. Maybe refactor in the future (similar process to getRecipes endpoint,
    // but without middleware)
    const tasks = Object.entries(categoryInfo.subCategories).map(
        async ([subCategoryName, subCategoryInfo]) => {
            const subCategorySearchCriteria = subCategoryInfo.searchCriteria;

            // 1) Build the payload
            const subCategoryPayload = {
                ...mainCategorySearchCriteria,
                ...subCategorySearchCriteria,
                limit: 10,
            };
            console.log("subCategoryPayload for ", subCategoryName, ": ", subCategoryPayload)

            // 2) Normalize and sanitize search params
            const parsedSearchOptions = {
                profileKey,
                ...normalizeSearchRequest(subCategoryPayload, profile),
            };

            console.dir(
                { [`parsedSearchOptions for ${subCategoryName}`]: parsedSearchOptions },
                { depth: null }
            );

            // 3) Build all necessary query info to be used for mongoose
            const searchOptions = compileRecipeSearch(parsedSearchOptions);
            console.log(`searchOptions for ${subCategoryName}:`)
            console.dir({ matchFilters: searchOptions.matchFilters }, { depth: null, maxArrayLength: null, colors: true });

            // 4) Execute the search
            const { results, totalCount, totalPages } = await searchDocuments(Recipe, searchOptions);

            return { subCategoryName, results, totalCount, totalPages };
        }
    );

    const settled = await Promise.allSettled(tasks);

    const subCategoryResults = {};
    for (const s of settled) {
        const { subCategoryName, results, totalCount, totalPages } = s.value;
        if (s.status === "fulfilled") {
            subCategoryResults[subCategoryName] = {
                results, 
                totalCount, 
                totalPages
            };
        } else {
            console.error("Subcategory failed:", s.reason);
            subCategoryResults[subCategoryName] = [];
        }
    }


    res.status(200).json({
        status: 'success',
        data: {
            categoryInfo,
            subCategoryRecipes: subCategoryResults
        }
    });
});

