const { getIndexedCategories } = require("./staticController");
const catchAsync = require("../utils/catchAsync");
const Recipe = require('../models/recipeModel')
const { ERROR_NAME, AppError } = require("../utils/appError");
const { searchDocuments } = require("../utils/searchUtils/searchExecution");
const { compileRecipeSearch } = require("../utils/searchUtils/builders/recipeBuilders");
const { RECIPES_PROFILES } = require("../policy/recipes.policy");
const { normalizeSearchRequest } = require("../normalizers/normalizeSearchRequest");
const { parseInput } = require("../middleware/parseInput");

const DEBUG = false;

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
            return searchCategory(categoryName, categoryInfo, profileKey, profile);
        });
    } else {
        tasks = [searchCategory(categoryInfo.slug, categoryInfo, profileKey, profile)];
    }

    const settled = await Promise.allSettled(tasks);

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
            console.error("category failed:", s.reason);
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

const searchCategory = async (categoryName, categoryInfo, profileKey, profile) => {
    const categorySearchCriteria = categoryInfo.searchCriteria;

    // 1) Build the payload
    const categoryPayload = {
        ...categorySearchCriteria,
        limit: 10,
    };
    if (DEBUG) console.debug("categoryPayload for ", categoryName, ": ", categoryPayload)

    // 2) Normalize and sanitize search params
    const parsedSearchOptions = {
        profile,
        ...normalizeSearchRequest(categoryPayload, profile).clean,
    };

    if (DEBUG) console.dir(
        { [`parsedSearchOptions for ${categoryName}`]: parsedSearchOptions },
        { depth: null }
    );

    // 3) Build all necessary query info to be used for mongoose
    const searchOptions = compileRecipeSearch(parsedSearchOptions);
    if (DEBUG) console.debug(`searchOptions for ${categoryName}:`)
    if (DEBUG) console.dir(searchOptions, { depth: null, maxArrayLength: null, colors: true });

    // 4) Execute the search
    const { results, totalCount, totalPages } = await searchDocuments(Recipe, searchOptions);
    
    return { categoryName, results, totalCount, totalPages };
}
