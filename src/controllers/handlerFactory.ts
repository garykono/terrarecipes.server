import { Request, Response, NextFunction } from "express";
import { HydratedDocument, Model, PopulateOptions, QueryWithHelpers, UpdateQuery } from "mongoose";

import catchAsync from '../utils/catchAsync';
import { AppError, ERROR_NAME } from '../utils/appError';
import { searchDocuments } from '../utils/searchUtils/searchExecution';

export const getAll = <T>(Model: Model<T>) => catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { results, totalCount, totalPages } = await searchDocuments(
        Model,
        req.options
    );

    res.status(200).json({
        status: 'success',
        results: totalCount,
        totalPages,
        data: { data: results }
    });
});

type PopulateArg = PopulateOptions | (string | PopulateOptions)[];

export const getOne = <T>(Model: Model<T>, popOptions?: PopulateArg) => catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = Model.findById(req.params.id) as QueryWithHelpers<
      HydratedDocument<T> | null,
      HydratedDocument<T>
    >;
    
    if (popOptions) {
      query = query.populate(popOptions);
    };
    // if (popOptions) {
    //     query = query.populate(popOptions);
    // }
    const doc = await query;

    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

export const createOne = <T>(Model: Model<T>) => catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.parsed);

    res.status(201).json({
        status: 'success',
        data: {
            doc: doc
        }
    });
});

export const updateOne = <T>(Model: Model<T>) => catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // This updates the document. If we used "PUT", then we would replace the whole doc with our new object
    const doc = await Model.findByIdAndUpdate(req.params.id, req.parsed as UpdateQuery<T>, {
        new: true,
        runValidators: true
    })
    
    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
    
});

export const deleteOne = <T>(Model: Model<T>) => catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id).setOptions({
        bypassActiveFilter: true
    });

    if (!doc) {
        return next(new AppError(404, ERROR_NAME.RESOURCE_NOT_FOUND, 'No resource found with that ID'));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});