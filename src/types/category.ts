export interface GetCategoryResponse {
    results: any;
    totalCount: any;
    totalPages: any;
}

export interface SearchCriteria {
    [key: string]: any
}

export interface CategoriesConfig {
    home: HomeCategorySection;
    core: CoreCategorySection;
    featured: Record<string, CategorySection<HomeCategoryConfig> | Record<string, CategorySection<HomeCategoryConfig>>>;
}

// Sub-category under a top-level category
export interface SubCategoryConfig {
    title: string;
    description: string;
    searchCriteria: SearchCriteria;
}

/******************
 * Simple Category Structures
 ******************/

export interface CategoryConfig {
    title: string;
    slug: string;
    icon: string;
    description: string;
}

export interface HomeCategoryConfig extends CategoryConfig {
    recipeIds?: string[];
    searchCriteria?: SearchCriteria;
}

export interface CoreCategoryConfig extends CategoryConfig {
    searchCriteria: SearchCriteria;
    subCategories: Record<string, SubCategoryConfig>;
    relatedCategories: string[];
}

export interface HomeCategories {
    [key: string]: HomeCategoryConfig;
}

/******************
 * Support for the featured categories shape
 ******************/

export type CategorySection<TConfig extends CategoryConfig = CategoryConfig> = Record<
    string,
    TConfig
>;

/** Convenience aliases (optional) */
export type HomeCategorySection = CategorySection<HomeCategoryConfig>;
export type CoreCategorySection = CategorySection<CoreCategoryConfig>;

export interface SeasonalFeaturedCategorySection {
    [key: string]: CategorySection;
}

/******************
 * Formatted categories
 ******************/

export interface IndexedCategories {
    [key: string]: CategorySection
}

export interface CategoryData {
    [key: string]: CategoryConfig[];
}