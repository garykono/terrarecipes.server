/* -- STANDARDIZED INGREDIENTS -- */

export interface StandardIngredient {
    name: string;
    plural: string;
    aliases: string[];
    categories: string[];
    forms: string[];
    defaultForm: string;
    substitutes: string[];
    intensity: string;
    storage: string;
    shelfLifeMonths: number;
    commonPreparations: string[];
    notes: string;
    tags: string[];
    averagePriceUSDPerUnit: number;
    treatOuncesAsVolume: boolean;
    standardConversionUnit: string;
    standardCountUnit: string;
    conversions: {
        countConversions: {
            [key: string]: number
        }
        crossConversions: {
            [key: string]: number
        }
        crossConversionsByForm: {
            [key: string]: {
                [key: string]: number
            }
        }
        trueValues: null;
    }
    mainCategory: string;
}

// An object used for quick ingredient lookups with format: [name of ingredient]: info about ingredient
export interface StandardIngredients {
    [key: string]: StandardIngredient;
}

export interface CategorizedIngredientList {
    [key: string]: StandardIngredient[];
}


/* -- INGREDIENT FORMS AND PREPARATIONS -- */
export type IngredientForms = string[];

export type IngredientPreparations = string[];


/* -- STANDARDIZED MEASUREMENTS -- */
export type StandardIngredientType = "mass" | "volume" | "count";

export interface StandardMeasurement {
    name: string;
    plural: string;
    symbol: string[];
    aliases: string[];
    type: StandardIngredientType;
}

export type StandardMeasurementsList = StandardMeasurement[];

export interface StandardMeasurements {
    [key: string]: StandardMeasurement;
};

/* -- GENERAL -- */

export type StandardLookupTable = {
    [key: string]: string;
};

export interface SearchCriteria {
    [key: string]: string | string[];
};

export interface Category {
    title: string;
    icon: string;
    description: string;
    slug: string;
    searchCriteria: SearchCriteria;
}

export interface FeaturedCategory extends Category {
    subCategories: {
        [key: string]: {
            title: string;
            description: string;
            searchCriteria: SearchCriteria
        }
    },
    relatedCategories: string[];
}

export interface CategorySection {
    [key: string]: Category;
}

export interface SeasonalFeaturedCategorySection {
    [key: string]: CategorySection;
}

export interface Categories {
    core: CategorySection;
    featured: {
        [key: string]: SeasonalFeaturedCategorySection | CategorySection;
    };
}

export interface IndexedCategories {
    [key: string]: CategorySection
}

export interface CategoryData {
    [key: string]: Category[];
}

export interface StandardTags {
    facets: {
        [key: string]: {
            id: string;
            label: string;
            multi: boolean;
            requirement: {
                min?: number;
                max?: number;
            }
            options: {
                id: string;
                label: string;
                isActive: boolean;
                sort: number;
            }[]
        }
    },
    custom: []
}
