import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { feedbackModel } from "../models/feedbackModel";

export const createFeedback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await feedbackModel.create(req.parsed);

    res.status(201).json({
        status: 'success',
        data: {
            doc: doc
        }
    });

    res.status(200).json({
        status: 'success',
        data: null
    });
});

export const deleteAllFeedback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await feedbackModel.deleteMany({});

    res.status(204).json({
        status: 'success',
        data: null
    });
});