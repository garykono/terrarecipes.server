export interface ParsedIngredient {
    quantity?: number;
    unit?: string;
    ingredient: string;
    forms?: string[];
    preparations?: string[];
    size?: "small" | "medium" | "large";
    isOptional?: boolean;
    optionalQuantity?: boolean;
    isSubstitute?: boolean,
    raw: string;
    parsedBy: 'manual' | 'fallback' | 'initialized';
}

export interface Ingredient {
    text: string;
    isSection: boolean;
    parsed?: ParsedIngredient[]
}

export interface Direction {
    text: string;
    isSection: boolean;
}

export interface Tags {
    facets: {
        [key: string]: string[]
    },
    custom: string[]
}

export interface Recipe {
    name: string;
    description: string;
    image: string;
    servings: number;
    prepTimeMin: number;
    cookTimeMin: number;
    restTimeMin: number;
    totalTimeMin: number;
    ingredients: Ingredient[];
    directions: Direction[];
    tags: Tags;
    credit: string | undefined;
    author: {
        _id: string;
        username: string;
    };
    _id: string;
}