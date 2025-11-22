const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
    // Pretty in dev, raw JSON in prod
    transport: process.env.NODE_ENV === "production"
        ? undefined
        : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } },
    base: { service: "terrarecipes-api" }, // constant fields on every line
    // Redact secrets if they might appear in logs
    redact: {
        paths: [
            // Common places secrets live:
            "req.headers.authorization",
            "req.headers.cookie",
            "req.headers['set-cookie']",
            "body.password",
            "body.token"
        ],
        censor: "[REDACTED]"
    }
    // redact: { paths: ["req.headers.authorization", "password", "token"], censor: "[redacted]" }
});

export default logger;