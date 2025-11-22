import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import logger from './utils/logger';

import app from './app';

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, "uncaughtException");
    process.exit(1);
})

if (!process.env.DATABASE) {
    throw new Error("DATABASE environment variable is missing");
}
if (!process.env.DATABASE_PASSWORD) {
    throw new Error("DATABASE_PASSWORD environment variable is missing");
}

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB).then(() => {
    logger.info('DB connection successful');
});

const port = process.env.SERVERPORT || 8080;
const server = app.listen(port, () => {
    if (process.env.NODE_ENV === 'development') {
        logger.info(`App running on port ${port}...`);
    } else {
        logger.info(`App running on domain '${process.env.SERVER_URL_PROD}'...`)
    }
});

process.on('unhandledRejection', (reason) => {
    //logger.fatal('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.fatal({ reason }, "unhandledRejection");
    server.close(() => {
        process.exit(1);
    })
});
