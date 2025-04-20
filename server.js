const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err);
    process.exit(1);
})

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(DB).then(() => {
    console.log('DB connection successful');
});

const port = process.env.SERVERPORT || 8080;
const server = app.listen(port, () => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`App running on port ${port}...`);
    } else {
        console.log(`App running on domain '${process.env.SERVER_URL_PROD}'...`)
    }
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});
