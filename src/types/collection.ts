import { Recipe } from "./recipe";

export interface Collection {
    _id: string;
    name: string;
    description: string;
    recipes: Recipe[];
    tags?: string[];
    author: {
        _id: string;
        username: string;
    };
}