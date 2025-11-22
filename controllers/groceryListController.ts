import { Request, Response, NextFunction } from "express";

const catchAsync = require("../utils/catchAsync");

export const previewGroceryList = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { sources } = req.parsed;

    // Derive all recipes from sources


    // Derive all collections from sources

    
    // Find all individual recipes and recipes from collections and add their ingredients to one list


    // Combine similar ingredients


    // Build the grocery list


    res.status(200).json({
        status: 'success',
        data: {
            groceryList
        }
    });
});