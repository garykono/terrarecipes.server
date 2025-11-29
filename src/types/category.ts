export interface CategoryData {
    results: any;
    totalCount: any;
    totalPages: any;
}

export type GroupConfig = Record<string, CategoryConfig> & {
    core: CoreCategoryConfig;      
    featured: CategoryConfig; 
};

// What a search criteria object can look like
export interface SearchCriteria {
    [key: string]: any
}

// Sub-category under a top-level category
export interface SubCategoryConfig {
    title: string;
    description: string;
    searchCriteria: SearchCriteria;
}

export interface CategoryConfig {
    title: string;
    slug: string;
    icon: string;
    description: string;
    searchCriteria: SearchCriteria;
}

// The main category object type
export interface CoreCategoryConfig extends CategoryConfig {
    subCategories: Record<string, SubCategoryConfig>;
    relatedCategories: string[];
}