import catchAsync from "../utils/catchAsync";
import { Request, Response, NextFunction } from 'express';
import { RecipeModel } from '../models/recipeModel';
import { BaseProfile, ProfileMaps } from '../types/policy';
import { CategoryConfig, CategoryData, CoreCategoryConfig, GroupConfig, SubCategoryConfig } from '../types/category';
import logger from '../utils/logger';
import { ERROR_NAME, AppError } from "../utils/appError";
import { searchDocuments } from "../utils/searchUtils/searchExecution";
import { RECIPES_PROFILES, RECIPE_PROFILE_MAPS } from "../policy/recipes.policy";
import { normalizeSearchRequest } from "../normalizers/normalizeSearchRequest";
import { buildSearch } from "../utils/searchUtils/builders/buildSearch";
import { CategorySection } from "../types/standardized";
import { getIndexedCategories } from "../services/standardizedDataService";

export const getCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const group = req.query.group as string | undefined;
    const slug = req.query.slug as string | undefined;

    // This is essentially just using the getAll recipes pipeline, so use its profile
    const profileKey = "getAll";
    const profile = RECIPES_PROFILES[profileKey];

    if (!group || !slug) {
        return next(new AppError(400, ERROR_NAME.PARAM_ERROR, 'Missing group and/or slug parameter!'));
    }
    
    const indexedCategories = await getIndexedCategories();
    if (!indexedCategories) {
        logger.warn({ indexedCategories }, "A required resource failed to load.")
        return next(new AppError(500, ERROR_NAME.SERVER_ERROR, `An error occurred.`));
    }

    const groupData: CategorySection = indexedCategories[group];
    if (!groupData) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no group with that name.`));
    }

    // Load the data for this category, including search terms
    const categoryInfo: CategoryConfig | CoreCategoryConfig = groupData[slug];
    if (!categoryInfo) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, `There is no category in ${group} with that slug.`));
    }
    
    // Go through the searching process for each subcategory. Maybe refactor in the future (similar process to getRecipes endpoint,
    // but without middleware)
    let tasks;
    if (group === "core") {
        tasks = Object.entries((categoryInfo as CoreCategoryConfig).subCategories).map(([categoryName, subCategoryInfo]) => {
            return searchCategory(req, categoryName, subCategoryInfo, profile, RECIPE_PROFILE_MAPS);
        });
    } else {
        tasks = [searchCategory(req, categoryInfo.slug, categoryInfo, profile, RECIPE_PROFILE_MAPS)];
    }

    const settled = await Promise.allSettled(tasks);

    const categoryResults: Record<string, CategoryData> = {};
    for (const s of settled) {
        if (s.status === "fulfilled") {
            const { categoryName, results, totalCount, totalPages } = s.value;
            categoryResults[categoryName] = {
                results, 
                totalCount, 
                totalPages
            };
        } else {
            req.log.warn({ settledPromise: s }, "Sub Category load failed")
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

const searchCategory = async (
    req: Request, 
    categoryName: string, 
    categoryInfo: SubCategoryConfig, 
    profile: BaseProfile, 
    profileMaps: ProfileMaps
) => {
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
    const { results, totalCount, totalPages } = await searchDocuments(RecipeModel, searchBuild as any);
    
    return { categoryName, results, totalCount, totalPages };
}
