const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp');

const app = express();
// Import Error Handling
const { AppError, ERROR_NAME } = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
// Import Routers
const staticRouter = require('./routes/staticRoutes');
const recipeRouter = require('./routes/recipeRoutes');
const userRouter = require('./routes/userRoutes');
const collectionRouter = require('./routes/collectionRoutes')
const categoryRouter = require('./routes/categoryRoutes');


// Global Middlewares
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    // Allows http requests between local ports
}

// Whitelist allowed client websites
app.use(cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV
    // origin: true,
    
    // exposedHeaders: ["Set-Cookie"]
}));

// Since behind proxy on Render, this line is needed for rate limiter to differentiate IP addresses on requests
app.set('trust proxy', 1);

// Limit requests from same API
const limiter = rateLimit({
    // How many times you make a request per windowMs
    limit: 1000,
    // 1 hour to ms
    windowMs: 60 * 60 * 1000,
    // message: 'Too many requests from this IP, please try again in an hour.',
    handler: (req, res) => {
        console.warn(`Rate limit hit: ${req.ip} ${req.method} ${req.originalUrl}`);
        res.status(429).json({ message: 'Too many requests from this IP, please try again in an hour.' });
    }
});
app.use(limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '50kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (cross-site scripting)
app.use(xss());

// Prevent paramater pollution. You can allow multiple arguments for the same parameter by whitelisting them. Ones not on this list
// will not be allowed. Just reference videos if you need to use this.
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsQuantity', 
        'ratingsAverage', 
        'maxGroupSize', 
        'difficulty', 
        'price'
    ]
}));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Mount Routes
app.use('/static', staticRouter);
app.use('/recipes', recipeRouter);
app.use('/users', userRouter);
app.use('/collections', collectionRouter);
app.use('/category', categoryRouter)

app.all('*', (req, res, next) => {
    next(new AppError(404, ERROR_NAME.URL_NOT_FOUND, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
