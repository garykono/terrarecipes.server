const { buildRecipeSearchFilter, buildMatchScoreField } = require('./searchHelpers.js');

exports.buildRecipeSearchOptions = ({ search, searchFields, sort, page }) => {
    // Later on, add back taking limit and fields as accepted req.query params OR santize them from whitelist made in utils/filtering

    const searchFieldArray = searchFields ? searchFields.split(",") : [];
    const filter = [];
    let addFields = {};
    let sortBy = sort;

    const isPaginated = !!page;
    const multiFieldSearch = searchFieldArray.length !== 1;
    const advancedSearch = !!search && multiFieldSearch;

    const useAggregate = isPaginated || advancedSearch;

    if (search) {
        const searchTerm = search.trim().replace('-', ' ');
        const regex = new RegExp(`\\b${searchTerm}\\b`, 'i');

        filter.push({ $or: buildRecipeSearchFilter(regex, searchFieldArray) });

        if (useAggregate) {
            addFields.matchScore = buildMatchScoreField(regex);
        }

        if (!sort && advancedSearch) {
            sortBy = "-matchScore";
        }
    }

    return {
        customFilter: filter.length ? { $and: filter } : {},
        addFields,
        useAggregate,
        sortBy
    };
}