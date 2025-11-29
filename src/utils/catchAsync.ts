import { NextFunction, Request, Response } from "express";

// Generic async wrapper for Express route handlers
// Keeps the parameter types of `fn` (req, res, next) intact.
const catchAsync = <T extends (req: Request, res: Response, next: NextFunction) => Promise<any>>(
    fn: T
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        void fn(req, res, next).catch(next);
    };
};

export default catchAsync;