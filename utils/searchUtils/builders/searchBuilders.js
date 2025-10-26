const { RECIPES_PROFILES, FIELD_MAP } = require('../../../policy/recipes.policy.js');
const { toRegex } = require('../searchHelpers.js');

/**
 * Build an array of match conditions from an individual search term/phrase.
 * 
 * @param {*} search The search term/phrase to be matched.
 * @param {*} fields The search fields to match the search term with
 * @returns 
 */
exports.buildRecipeSearchFilter = (
    search, 
    fields,
    profile
) => {
    if (!search) return [];

    const keys = (!!fields && fields.length ? fields : profile.allowedSearchFields);
    // Unknown keys ignored
    const paths = keys.flatMap((key) => FIELD_MAP[key] ?? []);
    // Produce the filters (an OR array)
    return paths.map(p => ({ [p]: search }));
};

/**
 * Build scoring conditions that will help sort results of an aggregation based on relevance.
 * 
 * @param {*} search 
 * @returns 
 */
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

/**
 * Normalize and santitize sort params into sort conditions used by mongoose.
 * 
 * @param {*} sort An array of strings that indicate sort params.
 * @returns 
 */
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

    sortFields._id = 1; // Allows continuity for results if all other sort values are equal between certain results

    return sortFields;
}

/**
 * Build pagination conditions to get pagination values out of an aggregation pipeline.
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