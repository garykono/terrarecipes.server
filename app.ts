import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Import Logging
import pinoHttp, { Options as PinoHttpOptions } from "pino-http";
import { nanoid } from "nanoid";
import logger from "./utils/logger";

const app = express();
// Import Error Handling
import { AppError, ERROR_NAME } from './utils/appError';
import globalErrorHandler from './controllers/errorController';
// Import Routers
import staticRouter from './routes/staticRoutes';
import recipeRouter from './routes/recipeRoutes';
import userRouter from './routes/userRoutes';
import collectionRouter from './routes/collectionRoutes';
import categoryRouter from './routes/categoryRoutes';

// Logging
app.use(pinoHttp({
    logger,
    // ensure every request gets a stable id (or use inbound x-request-id)
    genReqId: (req) => req.headers["x-request-id"]?.toString() || nanoid(),
    // Don’t auto-log super-noisy endpoints
    autoLogging: {
        ignore: (req) => req.url === "/healthz" || req.url === "/version"
    },

    // Map status → level
    customLogLevel: (req, res, err) => {
        if (err) return "error";
        if (res.statusCode >= 500) return 'info';  // we logged the real error in the error handler
        if (res.statusCode >= 400) return "warn";
        return "info";
    },

    // Suppress auto-added fields (req, res, responseTime)
    customAttributeKeys: {
        req: Symbol("ignore_req"),
        res: Symbol("ignore_res"),
    } as unknown as PinoHttpOptions["customAttributeKeys"],

    // Single-line messages
    // These run after the response completes -> responseTime is available
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode}`,

    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} - ${err?.message}`,

    // Keep only concise fields
    // serializers: {
    //     req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    //     res: (res) => ({ statusCode: res.statusCode })
    // },

    // Add your own context on every line
    customProps: (req, res) => ({
        reqId: req.id,
        userId: req.user?.id,
        errorName: res.locals?.errorName,
        errorMessage: res.locals.errorMsg
    })
}));

// Global Middlewares
// Set security HTTP headers
app.use(helmet());

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
        logger.warn(`Rate limit hit: ${req.ip} ${req.method} ${req.originalUrl}`);
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
// app.use(hpp({
//     whitelist: [
//         'duration', 
//         'ratingsQuantity', 
//         'ratingsAverage', 
//         'maxGroupSize', 
//         'difficulty', 
//         'price'
//     ]
// }));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Couple general routes
app.get('/healthz', (req, res) => res.status(200).send("ok"));
app.get("/version", (req, res) => {
  res.json({ version: process.env.APP_VERSION || "dev" });
});

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

export default app;
