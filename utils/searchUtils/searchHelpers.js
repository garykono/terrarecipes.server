/**
 * This is currently for ingredients, but may need to be generalized later
 * @param {*} search 
 * @param {*} fields 
 * @returns 
 */
exports.buildRecipeSearchFilter = (search, fields) => {
    if (!search) return [];

    const filter = [];

    if (fields && fields.length > 0) {
        // Simple search filter
        fields.forEach((field) => {
            switch (field) {
                case "name":
                    filter.push({ name: { $regex: search } });
                    break;
                case "tags":
                    filter.push({ tags: { $regex: search } });
                    break;
                case "ingredients":
                    filter.push({ "ingredients.parsed.ingredient": { $regex: search } });
                    filter.push({ "ingredients.text": { $regex: search }  });
                    break;
                default: 
                    console.log(`Search Field: '${field}' did not match any option`);
            }
        })
    } else {
        return [
            { name: { $regex: search } },
            { tags: { $regex: search } },
            { 'ingredients.parsed.ingredient': { $regex: search } },
            { 'ingredients.text': { $regex: search }  }
        ];
    }

    return filter;
};

exports.buildMatchScoreField = (search) => {
    return {
        $add: [
            { $cond: [{ $regexMatch: { input: '$name', regex: search } }, 3, 0] },
            { $cond: [
                    {
                    $anyElementTrue: {
                        $map: {
                            input: '$tags',
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

exports.buildSortFilter = sort => {
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
