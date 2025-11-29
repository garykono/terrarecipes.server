import { Request, Response, NextFunction } from "express"
import catchAsync from '../utils/catchAsync';
import { getStandardizedData } from "../services/standardizedDataService";

export const getFiles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = await getStandardizedData();

    res.status(200).json({
        status: 'success',
        data
    });  
});