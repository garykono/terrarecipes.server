import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_NAME } from '../utils/appError';

type RawError = Error & {
    code?: number;          // for Mongo duplicate key (11000)
    name?: string;          // for CastError, ValidationError, JsonWebTokenError, etc.
    [key: string]: any;     // optional, if you don't want to fight every lib shape
};

const handleCastErrorDB = (err: any) => {
    const message = 'There was an error due to a wrong data type given, likely invalid ID or ID formatting.'
    return new AppError(400, ERROR_NAME.CAST_ERROR, message, {
        errors: [`Invalid ${err.path}: ${err.value}`]
    });
}

const handleDuplicateFieldsDB = (err: any) => {
    const errors = Object.keys(err.keyValue).map(field => `${field}: This ${field} is already taken.`);
    // const field = parsed[0];
    // const value = parsed[1].split('"')[0];
    // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `A unique field is already in use.`;
    return new AppError(400, ERROR_NAME.DUPLICATE_FIELD_ERROR, message, { errors });
}
const handleValidationErrorDB = (err: any) => {
    // const errors = Object.values(err.errors).map(el => el.message);
    // const message = `Invalid input data. ${errors.join('. ')}`;

    const message = 'One or more validation errors occurred.';

    return new AppError(400, ERROR_NAME.VALIDATION_ERROR, message, {
        errors: Object.values(err.errors).map((el: any) => `${el.path}: ${el.message}`)
    });
}

const handleJsonWebTokenError = (err: any) => {
    const message = 'JSON web token is not valid.';

    return new AppError(400, ERROR_NAME.INVALID_JWT, message);
}

const sendError = (err: AppError | Error, req: Request, res: Response) => {
    // We set this error as operational (an issue with something like an input from client), so we want the client to know what
    // went wrong
    if (err instanceof AppError) {
        // For logging
        res.locals.errorName = err.name;
        res.locals.errorMsg = err.message;
        
        // Always sent if error is operational
        let errData = {
            status: err.status,
            message: err.message,
            name: err.name,
            errors: err.errors,
            additionalInfo: err.additionalInfo
        } as any;
        // Only give the stack if in development
        if (process.env.NODE_ENV !== 'production') {
            errData.isOperational = err.isOperational;
            errData.stack = err.stack;
        }
        
        res.status(err.statusCode).json(errData);
    } else {
        req.log.error(
            {
                reqId: req.id,
                userId: req.user?.id,
                route: `${req.method} ${req.originalUrl ?? req.url}`,
                err                       // pino will serialize stack safely
            },
            "Unhandled server error"
        );

        // Send generic message because we don't want outsiders see details about an uncaught error
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

export default (err: any, req: Request, res: Response, next: NextFunction) => {
    // 1) Normalize
    let normalized = err;
    normalized.statusCode = normalized.statusCode || 500;
    // normalized.status = normalized.status || 'error';
    normalized.name = normalized.name || 'SERVER_ERROR';

    // 2) Map common library errors -> AppError types (only used in production, dev mode instead gives the whole error stack)
    if (normalized.name === 'CastError') normalized = handleCastErrorDB(err);
    if (normalized.code === 11000) normalized = handleDuplicateFieldsDB(err);
    if (normalized.name === 'ValidationError') normalized = handleValidationErrorDB(err);
    if (normalized.name === 'JsonWebTokenError') normalized= handleJsonWebTokenError(err);

    // 3) Send error response
    sendError(normalized, req, res);
}
    

    