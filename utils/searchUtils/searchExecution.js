const APIFeatures = require('../apiFeatures');
const { buildSortFilter } = require('./searchHelpers');
const { buildPipelineFromQuery } = require('../buildPipelineFromQuery');

/**
 * Executes a search query for any Mongoose Model
 * @param {MongooseModel} Model - The model to query (e.g., Recipe, User)
 * @param {Object} options - Search options (built by your buildRecipeSearchOptions or similar)
 * @param {Object} queryParams - Original request query params (pagination, sorting, etc.)
 */
exports.searchDocuments = async (Model, options, queryParams = {}) => {
    const {
        customFilter = {},
        addFields,
        useAggregate = false,
        sortBy = 'name'
    } = options;

    let results, totalCount, totalPages;

    if (useAggregate) {
        const pipeline = [];

        if (customFilter) pipeline.push({ $match: customFilter });
        if (addFields) pipeline.push({ $addFields: addFields });
        if (sortBy) pipeline.push({ $sort: buildSortFilter(sortBy) });

        // Pagination pipeline if needed
        pipeline.push(...buildPipelineFromQuery(queryParams));

        const [aggregated] = await Model.aggregate(pipeline);
        results = aggregated.results;
        totalCount = aggregated.totalCount;
        totalPages = aggregated.totalPages;
    } else {
        const features = new APIFeatures(Model.find(), queryParams)
            .addQueryFilters()
            .addCustomFilters(customFilter)
            .applyFilters()
            .sort(sortBy)
            .limitFields()
            .paginate();

        results = await features.query;
        totalCount = results.length;
        totalPages = 1;
    }

    return { results, totalCount, totalPages };
}