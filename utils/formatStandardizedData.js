exports.formatIngredients = (ingredients) => {
    const formattedIngredients = {};
    Object.keys(ingredients).forEach(category => {
        // For each ingredient
        ingredients[category].forEach(ingredient => { 
            // const { name, ...ingredientWithoutName } = ingredient; i'll leave the name in because it's easier to flatten for fuse
            formattedIngredients[ingredient.name] = {
                ...ingredient,
                mainCategory: category
            }
        })
    });

    return formattedIngredients;
}

exports.formatMeasurementUnits = (ingredients) => {
    const formattedMeasurementUnits = {};
    ingredients.forEach(ingredient => { 
        // const { name, ...ingredientWithoutName } = ingredient; i'll leave the name in because it's easier to flatten for fuse
        formattedMeasurementUnits[ingredient.name] = {
            ...ingredient
        }
    })

    return formattedMeasurementUnits;
}

exports.indexStandardizedList = standardList => {
    const indexedList = {};
    Object.keys(standardList).forEach(standardName => {
        // Add the original form to the list
        indexedList[standardName] = standardName;
        // Add the plural version that will map back to the ingredient's standard name
        const pluralName = standardList[standardName].plural;
        const symbols = standardList[standardName].symbol
        const aliases = standardList[standardName].aliases;
        if (pluralName) indexedList[pluralName] = standardName;
        if (symbols) {
            symbols.forEach(symbol => {
                indexedList[symbol] = standardName;
            })
        }
        if (aliases) {
            aliases.forEach(alias => {
                indexedList[alias] = standardName;
            })
        }
    })
    return indexedList;
}

exports.indexCategories = (categories) => {
    const indexedList = {};
    // Core and Featured
    Object.keys(categories).forEach(categoryGroupName => {
        if (categoryGroupName === 'core') {
            indexedList[categoryGroupName] = {
                ...categories[categoryGroupName]
            };
        } else if (categoryGroupName === 'featured') {
            indexedList[categoryGroupName] = {};
            // Seasonal
            const seasons = categories[categoryGroupName].seasonal;
            Object.keys(seasons).forEach(seasonName => {
                const categoriesForCurrentSeason = seasons[seasonName];
                Object.keys(categoriesForCurrentSeason).forEach(category => {
                    indexedList[categoryGroupName][category] = categoriesForCurrentSeason[category];
                })
            })
            // Holiday and Event
            const holidayAndEventCategories = categories[categoryGroupName].holidayAndEvent;
            Object.keys(holidayAndEventCategories).forEach(category => {
                indexedList[categoryGroupName][category] = holidayAndEventCategories[category];
            })
            // Discovery
            const discoveryCategories = categories[categoryGroupName].discovery;
            Object.keys(discoveryCategories).forEach(category => {
                indexedList[categoryGroupName][category] = discoveryCategories[category];
            })
        }
    })
    return indexedList;
}

exports.prepareCategoryData = (indexedCategories) => {
    const categoryData = {};
    // Core
    Object.keys(indexedCategories).forEach(categoryGroupName => {
        categoryData[categoryGroupName] = [];
        if (categoryGroupName === 'core') {
            const coreIndexedCategories = indexedCategories[categoryGroupName];
            Object.keys(coreIndexedCategories).forEach(coreCategoryName => {
                categoryData[categoryGroupName].push({
                    ...coreIndexedCategories[coreCategoryName],
                    key: coreCategoryName
                })
            })
        } else if (categoryGroupName === 'featured') {
            const featuredRecipeKeys = [
                "autumn harvest", 
                "pumpkin everything", 
                "apple and pear recipes",
                "thanksgiving classics", 
                "halloween treats",
                "one pot wonders",
                "healthy and seasonal",
                "global fall flavors"
            ];
            const featuredIndexedCategories = indexedCategories[categoryGroupName];
            featuredRecipeKeys.forEach(featuredRecipeKey => {
                categoryData[categoryGroupName].push({
                    ...featuredIndexedCategories[featuredRecipeKey],
                    key: featuredRecipeKey
                })
            })
        }
    })
    return categoryData;
}
