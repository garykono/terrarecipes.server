exports.formatIngredients = (ingredients) => {
    const formattedIngredients = {};
    Object.keys(ingredients).forEach(category => {
        // For each ingredient
        ingredients[category].forEach(ingredient => { 
            // const { name, ...ingredientWithoutName } = ingredient; i'll leave the name in because it's easier to flatten for fuse
            formattedIngredients[ingredient.name] = {
                ...ingredient,
                category
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