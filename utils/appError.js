class AppError extends Error {
    constructor(statusCode, name, message, options) {
        super(message);
        
        this.name = name;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = options?.errors;

        // Stops stack trace from showing the function call of this constructor
        Error.captureStackTrace(this, this.constructor);
    }
}

exports.ERROR_NAME = {
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

    //500
    SERVER_ERROR: 'SERVER_ERROR',
    EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
}

exports.AppError = AppError;