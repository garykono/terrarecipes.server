/**
 * Handles pagination based on query.
 * 
 * @param {*} query May include query.page and query.limit
 * @returns 
 */
exports.buildPipelineFromQuery = (query) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 100, 1);
    const skip = (page - 1) * limit;

    const pipeline = [];

    // Use $facet to split data and metadata
    pipeline.push({
        $facet: {
            results: [
                { $skip: skip },
                { $limit: limit }
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    });

    // Flatten facet results and compute totalPages (because $count inside of $facet always returns an array)
    pipeline.push({
        $addFields: {
            totalCount: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] },
        }
    });

    pipeline.push({
        $addFields: {
            totalPages: {
                $ceil: { $divide: ['$totalCount', limit] }
            }
        }
    });

    return pipeline;
};