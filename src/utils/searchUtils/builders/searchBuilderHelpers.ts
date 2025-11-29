/**
 * Build an array of match conditions from an individual search term/phrase.
 *
 * @param search  The search term/phrase (string or RegExp)
 * @param fields  The search fields to match the search term with
 * @param fieldMap Map from logical field keys to actual Mongo paths
 */
export const buildSearchFilter = (
    search: string | RegExp | null | undefined,
    fields: string[] | undefined,
    fieldMap: Record<string, string[]>
): Array<Record<string, string | RegExp>> => {
    if (!search) return [];

    const keys = fields ?? [];
    // Unknown keys ignored
    const paths = keys.flatMap((key) => fieldMap[key] ?? []);
    // Produce the filters (an OR array)
    return paths.map(p => ({ [p]: search }));
};

/**
 * Build scoring conditions that will help sort results of an aggregation based on relevance.
 * 
 * @param search A regex used in $regexMatch expressions
 * @returns 
 */
export const buildMatchScoreField = (search: RegExp) => {
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
 * @param sort              Comma-separated sort string (e.g. "name,-rating")
 * @param allowedSortFields Whitelist of allowed fields
 * @returns 
 */
export const buildSortFilter = (
    sort: string,
    allowedSortFields: string[]
): Record<string, 1 | -1> => {
    const sortFields = sort.split(',').reduce<Record<string, 1 | -1>>((acc, field) => {
        const trimmed = field.trim();
        const key = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
        if (allowedSortFields.includes(key)) {
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
export const buildPaginationPipeline = (
    page: number,
    limit: number,
    skip: number
) => {
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