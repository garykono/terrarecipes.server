import { FilterQuery, Model } from 'mongoose';
import { RECIPE_DEFAULT_SORT_KEY, RECIPE_PAGE_LIMITS } from '../../policy/recipes.policy';
import APIFeatures from '../apiFeatures';
import { buildPaginationPipeline } from './builders/searchBuilderHelpers';

// What each search call returns
export interface SearchResult<T> {
    results: T[];
    totalCount: number;
    totalPages: number;
}

// Options passed into searchDocuments (from buildRecipeSearchOptions or similar)
export interface SearchOptions<T> {
    matchFilters?: FilterQuery<T>;
    addFields?: Record<string, unknown>;
    sortObj?: string;
    project?: string;
    page?: number;
    limit?: number;
    useAggregate?: boolean;
}

/**
 * Executes a search query for any Mongoose Model
 * @param {MongooseModel} Model - The model to query (e.g., Recipe, User)
 * @param {Object} options - Search options (built by buildRecipeSearchOptions or similar)
 * @param {Object} queryParams - Original request query params (pagination, sorting, etc.)
 */
export const searchDocuments = async <T>(
    Model: Model<T>,
    options: SearchOptions<T>
): Promise<SearchResult<T>> => {
    // Create a filter from queries. This will be created somewhere else and stored in options
    // Add text search filters to options if doing a text search
    const {
        matchFilters = {},
        addFields,
        sortObj = RECIPE_DEFAULT_SORT_KEY,    // can be string or object
        project = "",    // can be string or object
        page = 1, 
        limit = RECIPE_PAGE_LIMITS.defaultPerPage,
        useAggregate = false,
    } = options;

    const skip = (page - 1) * limit;
    let results: T[], totalCount, totalPages;

    if (useAggregate) {
        const pipeline = [];

        if (matchFilters && Object.keys(matchFilters).length > 0) {
            pipeline.push({ $match: matchFilters });
        }
        if (addFields) pipeline.push({ $addFields: addFields });
        if (sortObj) pipeline.push({ $sort: sortObj });
        if (project) pipeline.push({ $project: project });

        // Pagination pipeline if needed
        pipeline.push(...buildPaginationPipeline(page, limit, skip));

        const [aggregated] = await Model.aggregate(pipeline as any[]);
        results = aggregated.results;
        totalCount = aggregated.totalCount;
        totalPages = aggregated.totalPages;
    } else {
        const features = new APIFeatures(Model.find())
            .addFilters(matchFilters)
            .sort(sortObj)
            .limitFields(project)
            .startCount()
            .paginate(page, limit, skip);

        const featuresRes = await features.exec();
        results = featuresRes.results;
        totalCount = featuresRes.total;
        totalPages = Math.max(1, Math.ceil(totalCount / limit));
    }

    return { results, totalCount, totalPages };
}