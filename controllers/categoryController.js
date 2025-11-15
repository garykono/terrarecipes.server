const { getIndexedCategories } = require("./staticController");
const catchAsync = require("../utils/catchAsync");
const Recipe = require('../models/recipeModel')
const { ERROR_NAME, AppError } = require("../utils/appError");
const { searchDocuments } = require("../utils/searchUtils/searchExecution");
const { RECIPES_PROFILES, RECIPE_PROFILE_MAPS } = require("../policy/recipes.policy");
const { normalizeSearchRequest } = require("../normalizers/normalizeSearchRequest");
const { buildSearch } = require("../utils/searchUtils/builders/buildSearch");

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
    
    // Go through the searching process for each subcategory. Maybe refactor in the future (similar process to getRecipes endpoint,
    // but without middleware)
    let tasks;
    if (group === "core") {
        tasks = Object.entries(categoryInfo.subCategories).map(([categoryName, categoryInfo]) => {
            return searchCategory(req, categoryName, categoryInfo, profile, RECIPE_PROFILE_MAPS);
        });
    } else {
        tasks = [searchCategory(req, categoryInfo.slug, categoryInfo, profile, RECIPE_PROFILE_MAPS)];
    }

    const settled = await Promise.allSettled(tasks);
    console.log("settled: ", settled)

    const categoryResults = {};
    for (const s of settled) {
        const { categoryName, results, totalCount, totalPages } = s.value;
        if (s.status === "fulfilled") {
            categoryResults[categoryName] = {
                results, 
                totalCount, 
                totalPages
            };
        } else {
            req.log.warn({ settledPromise: s }, "Sub Category load failed")
            categoryResults[categoryName] = [];
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            categoryInfo,
            recipes: categoryResults
        }
    });
});

const searchCategory = async (req, categoryName, categoryInfo, profile, profileMaps) => {
    const categorySearchCriteria = categoryInfo.searchCriteria;

    // 1) Build the payload
    const categoryPayload = {
        ...categorySearchCriteria,
        limit: 10,
    };

    // 2) Normalize and sanitize search params
    const parsedSearchOptions = {
        profile,
        ...normalizeSearchRequest(categoryPayload, profile).clean,
    };

    // 3) Build all necessary query info to be used for mongoose
    const searchBuild = buildSearch({
            profileMaps,
            ...parsedSearchOptions
    });

    
    req.log.debug({ categoryName, categoryPayload, parsedSearchOptions, searchBuild }, "Search Category build");

    // 4) Execute the search
    const { results, totalCount, totalPages } = await searchDocuments(Recipe, searchBuild);
    
    return { categoryName, results, totalCount, totalPages };
}
