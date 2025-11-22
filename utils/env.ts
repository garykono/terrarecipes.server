import path from "path";
import dotenv from "dotenv";

// Load config.env relative to this file
dotenv.config({
    path: path.resolve(__dirname, "../config.env"), // adjust one ../ if needed
});

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

// ---- Define the list of required env vars here ----
// This centralizes everything and keeps types in sync.
const requiredVars = [
    "NODE_ENV",
    "APP_VERSION",

    "CLIENT_URL_DEV",
    "CLIENT_URL_PROD",
    "SERVERPORT",
    "SERVER_URL_PROD",

    "DATABASE",
    "DATABASE_USERNAME",
    "DATABASE_PASSWORD",

    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "JWT_COOKIE_EXPIRES_IN_DAYS",

    "RESEND_API_KEY",
    "EMAIL_FROM",
    "SUPPORT_EMAIL_ADDRESS",
] as const;

const optionalVars = [    
    "LOG_LEVEL",
] as const; // <-- example optional vars, replace with your own

// Types
type RequiredVar = (typeof requiredVars)[number];
type OptionalVar = (typeof optionalVars)[number];

// ------------------------------
//   Build final env object
// ------------------------------

// Required values MUST exist
const requiredObject: Record<RequiredVar, string> = requiredVars.reduce(
    (acc, key) => {
        acc[key] = getEnv(key);
        return acc;
    },
    {} as Record<RequiredVar, string>
);

// Optional values MAY exist, fallback is undefined
const optionalObject: Record<OptionalVar, string | undefined> =
    optionalVars.reduce(
        (acc, key) => {
        acc[key] = process.env[key];
        return acc;
        },
        {} as Record<OptionalVar, string | undefined>
    );

// Final combined type
type Env = Record<RequiredVar, string> &
    Record<OptionalVar, string | undefined>;

// Final combined export
const env: Env = {
    ...requiredObject,
    ...optionalObject,
};

export default env;