const { AppError, ERROR_NAME } = require('../utils/appError')

const handleCastErrorDB = err => {
    const message = 'There was an error due to a wrong data type given, likely invalid ID or ID formatting.'
    return new AppError(400, ERROR_NAME.CAST_ERROR, message, {
        errors: [`Invalid ${err.path}: ${err.value}`]
    });
}

const handleDuplicateFieldsDB = err => {
    console.log(err)
    const errors = Object.keys(err.keyValue).map(field => `${field}: This ${field} is already taken.`);
    // const field = parsed[0];
    // const value = parsed[1].split('"')[0];
    // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `A unique field is already in use.`;
    return new AppError(400, ERROR_NAME.DUPLICATE_FIELD_ERROR, message, { errors });
}
const handleValidationErrorDB = err => {
    // const errors = Object.values(err.errors).map(el => el.message);
    // const message = `Invalid input data. ${errors.join('. ')}`;

    const message = 'One or more validation errors occurred.';

    return new AppError(400, ERROR_NAME.VALIDATION_ERROR, message, {
        errors: Object.values(err.errors).map(el => `${el.path}: ${el.message}`)
    });
}
const handleJsonWebTokenError = err => {
    const message = 'JSON web token is not valid.';

    return new AppError(400, ERROR_NAME.INVALID_JWT, message);
}

const sendError = (err, res) => {
    // We set this error as operational (an issue with something like an input from client), so we want the client to know what
    // went wrong
    if (err.isOperational) {
        let errData = {
            status: err.status,
            message: err.message,
            name: err.name,
            errors: err.errors,
        }
        if (process.env.NODE_ENV === 'production') {
            res.status(err.statusCode).json(errData);
        } else {
            res.status(err.statusCode).json({
                ...errData,

                isOperational: err.isOperational,
                stack: err.stack
            });
        }
    // The error is something else that we don't want to send too much info to the client about because it's unrelated to the client
    } else {
        // 1) Log Error
        console.error('ERROR 💥', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.name = err.name || 'SERVER_ERROR';

    // These errors are only in production because we would rather see more info directly from the error when in dev mode
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJsonWebTokenError(err);
    sendError(err, res);
}
    

    