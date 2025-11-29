export interface AppErrorOptions {
    errors?: unknown;                 // your validation / sub-errors
    [key: string]: unknown;          // allow any extra metadata
}

export class AppError extends Error {
    statusCode: number;
    name: ErrorName;
    status: "fail" | "error";
    isOperational: boolean;
    errors?: unknown;
    additionalInfo?: Record<string, unknown>;

    constructor(
        statusCode: number, 
        name: ErrorName, 
        message: string, 
        options?: AppErrorOptions
    ) {
        super(message);
        
        this.statusCode = statusCode;
        this.name = name;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = options?.errors;
        this.additionalInfo = {
            ...options,
            errors: undefined
        }

        // Stops stack trace from showing the function call of this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

export type ErrorName = typeof ERROR_NAME[keyof typeof ERROR_NAME];

export const ERROR_NAME = {
    //400
    CAST_ERROR: 'CAST_ERROR',
    DUPLICATE_FIELD_ERROR: 'DUPLICATE_FIELD_ERROR',
    INVALID_JWT: 'INVALID_JWT',
    INVALID_TOKEN: 'INVALID_TOKEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PARAM_ERROR: 'PARAM_ERROR',
    INVALID_FIELDS_ERROR: 'INVALID_FIELDS_ERROR',

    //401
    UNAUTHORIZED: 'UNAUTHORIZED',

    //403
    FORBIDDEN: 'FORBIDDEN',

    //404
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    URL_NOT_FOUND: 'URL_NOT_FOUND',

    //409
    ALREADY_VERIFIED: 'ALREADY_VERIFIED',
    ALREADY_TAKEN: 'ALREADY_TAKEN',
    SAME_EMAIL: 'SAME_EMAIL',

    //429
    RESEND_INTERVAL_NOT_ELAPSED: 'RESEND_INTERVAL_NOT_ELAPSED',
    DAILY_EMAIL_LIMIT_EXCEEDED: 'DAILY_EMAIL_LIMIT_EXCEEDED',

    //500
    SERVER_ERROR: 'SERVER_ERROR',
    EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
}

exports.AppError = AppError;