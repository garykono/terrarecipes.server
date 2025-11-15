const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const { logger } = require('./utils/logger');

const app = require('./app');

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, "uncaughtException");
    process.exit(1);
})

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
