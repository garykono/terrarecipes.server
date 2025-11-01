const { RECIPE_DEFAULT_SORT_KEY, RECIPE_PAGE_LIMITS } = require('../../policy/recipes.policy');
const APIFeatures = require('../apiFeatures');
const { buildPaginationPipeline } = require('./builders/searchBuilderHelpers');

/**
 * Executes a search query for any Mongoose Model
 * @param {MongooseModel} Model - The model to query (e.g., Recipe, User)
 * @param {Object} options - Search options (built by buildRecipeSearchOptions or similar)
 * @param {Object} queryParams - Original request query params (pagination, sorting, etc.)
 */
exports.searchDocuments = async (Model, options) => {
    // Create a filter from queries. This will be created somewhere else and stored in options
    // Add text search filters to options if doing a text search
    const {
        matchFilters = {},
        addFields,
        sortObj = RECIPE_DEFAULT_SORT_KEY,    // can be string or object
        project,    // can be string or object
        page = 1, 
        limit = RECIPE_PAGE_LIMITS.defaultPerPage,
        useAggregate = false,
    } = options;

    const skip = (page - 1) * limit;
    let results, totalCount, totalPages;

    if (useAggregate) {
        const pipeline = [];

        if (matchFilters) pipeline.push({ $match: matchFilters});
        if (addFields) pipeline.push({ $addFields: addFields });
        if (sortObj) pipeline.push({ $sort: sortObj });
        if (project) pipeline.push({ $project: project });
        // Pagination pipeline if needed
        pipeline.push(...buildPaginationPipeline(page, limit, skip));

        const [aggregated] = await Model.aggregate(pipeline);
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