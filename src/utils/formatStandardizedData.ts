import { Categories, CategorizedIngredientList, CategoryData, CategorySection, IndexedCategories, SeasonalFeaturedCategorySection, StandardIngredients, StandardLookupTable, StandardMeasurements, StandardMeasurementsList } from "../types/standardized";

export const formatIngredients = (ingredients: CategorizedIngredientList) => {
    const formattedIngredients: StandardIngredients = {};
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

export const formatMeasurementUnits = (measurementUnits: StandardMeasurementsList) => {
    const formattedMeasurementUnits: StandardMeasurements = {};
    measurementUnits.forEach(measurementUnit => { 
        formattedMeasurementUnits[measurementUnit.name] = {
            ...measurementUnit
        }
    })

    return formattedMeasurementUnits;
}

export const indexStandardizedList = (standardList: { [key: string]: any }) => {
    const indexedList: StandardLookupTable = {};
    Object.keys(standardList).forEach(standardName => {
        // Add the original form to the list
        indexedList[standardName] = standardName;
        // Add the plural version that will map back to the ingredient's standard name
        const pluralName = standardList[standardName].plural;
        const symbols: string[] = standardList[standardName].symbol
        const aliases: string[] = standardList[standardName].aliases;
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

function indexCategoriesBySlug(data: CategorySection, indexedList: IndexedCategories, categoryGroupName: string) {
    Object.entries(data).forEach(([categoryName, categoryInfo]) => {
        // Use slugs as keys for lookups
        const slug = categoryInfo.slug;
        indexedList[categoryGroupName][slug] = categoryInfo;
    })
}

export const indexCategories = (categories: Categories) => {
    const indexedList: IndexedCategories = {};
    // Core and Featured
    Object.keys(categories).forEach(categoryGroupName => {
        if (categoryGroupName === 'core') {
            indexedList[categoryGroupName] = {};
            indexCategoriesBySlug(categories[categoryGroupName], indexedList, categoryGroupName);
        } else if (categoryGroupName === 'featured') {
            indexedList[categoryGroupName] = {};
            // Seasonal
            const seasons: SeasonalFeaturedCategorySection = categories[categoryGroupName].seasonal as SeasonalFeaturedCategorySection;
            Object.keys(seasons).forEach(seasonName => {
                const categoriesForCurrentSeason: CategorySection = seasons[seasonName];
                indexCategoriesBySlug(categoriesForCurrentSeason, indexedList, categoryGroupName);
            })
            // Holiday and Event
            const holidayAndEventCategories: CategorySection = categories[categoryGroupName].holidayAndEvent as CategorySection;
            indexCategoriesBySlug(holidayAndEventCategories, indexedList, categoryGroupName);
            // Discovery
            const discoveryCategories: CategorySection = categories[categoryGroupName].discovery as CategorySection;
            indexCategoriesBySlug(discoveryCategories, indexedList, categoryGroupName);
        }
    })
    return indexedList;
}

export const prepareCategoryData = (indexedCategories: IndexedCategories) => {
    const categoryData: CategoryData = {};
    // Core
    Object.keys(indexedCategories).forEach(categoryGroupName => {
        categoryData[categoryGroupName] = [];
        if (categoryGroupName === 'core') {
            const coreIndexedCategories = indexedCategories[categoryGroupName];
            Object.keys(coreIndexedCategories).forEach(coreCategoryName => {
                categoryData[categoryGroupName].push({
                    ...coreIndexedCategories[coreCategoryName]
                })
            })
        } else if (categoryGroupName === 'featured') {
            // The featured categories that will be given to the front end at this time
            const featuredRecipeKeys = [
                "autumn-harvest", 
                "pumpkin-everything", 
                "apple-pear-recipes",
                "thanksgiving-classics", 
                "halloween-treats",
                "one-pot-wonders",
                "healthy-and-seasonal",
                "global-fall-flavors"
            ];
            const featuredIndexedCategories = indexedCategories[categoryGroupName];
            // Only send info for the allowed featured recipe categories
            featuredRecipeKeys.forEach(featuredRecipeKey => {
                categoryData[categoryGroupName].push({
                    ...featuredIndexedCategories[featuredRecipeKey]
                })
            })
        }
    })
    return categoryData;
}
