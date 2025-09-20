const { RECIPES_PROFILES, FIELD_MAP } = require('../../../policy/recipes.policy.js');
const { toRegex } = require('../searchHelpers.js');

/**
 * 
 * @param {*} search 
 * @param {*} fields 
 * @returns 
 */
exports.buildRecipeSearchFilter = (
    search, 
    fields,
    profileKey
) => {
    if (!search) return [];

    const keys = (fields && fields.length ? fields : RECIPES_PROFILES[profileKey].allowedSearchFields);
    // Unknown keys ignored
    const paths = keys.flatMap((key) => FIELD_MAP[key] ?? []);
    // Produce the filters (an OR array)
    return paths.map(p => ({ [p]: search }));
};

exports.buildMatchScoreField = (search) => {
    return {
        $add: [
            { $cond: [{ $regexMatch: { input: '$name', regex: search } }, 3, 0] },
            { $cond: [
                    {
                    $anyElementTrue: {
                        $map: {
                            input: '$tagsFlat',
                            as: 'tag',
                            in: { $regexMatch: { input: '$$tag', regex: search } }
                        }
                    }
                    }, 2, 0
            ]},
            { $cond: [
                { $anyElementTrue: {
                        $map: {
                            input: '$ingredients',
                            as: 'ing',
                            in: {
                                $anyElementTrue: {
                                    $map: {
                                        input: {
                                            $cond: [
                                                { $isArray: '$$ing.parsed' },
                                                '$$ing.parsed',
                                                []
                                            ]
                                        },
                                        as: 'p',
                                        in: {
                                            $regexMatch: {
                                                input: '$$p.ingredient',
                                                regex: search
                                            }
                                        }
                                    }
                                }
                            }
                        }
                }}, 1.5, 0
            ]},
            { $cond: [
                { $anyElementTrue: {
                    $map: {
                        input: '$ingredients',
                        as: 'ing',
                        in: {
                            $regexMatch: {
                                input: '$$ing.text',
                                regex: search
                            }
                        }
                    }
                }}, 1, 0
            ]}
        ]
    };
}

exports.buildSortFilter = (sort) => {
    const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'author', 'matchScore'];

    const sortFields = sort.split(',').reduce((acc, field) => {
        const trimmed = field.trim();
        const key = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
        if (ALLOWED_SORT_FIELDS.includes(key)) {
            acc[key] = trimmed.startsWith('-') ? -1 : 1;
        }
        return acc;
    }, {});

    return sortFields;
}

/**
 * Handles pagination based on query.
 */
exports.buildPaginationPipeline = (page, limit, skip) => {
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