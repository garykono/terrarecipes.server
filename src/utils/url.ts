// utils/url.js
import { env } from "process";
import  { URL } from "url";
export const buildFrontendUrl = (pathAndQuery: string) => {
    const base = env.NODE_ENV === "production" ? env.CLIENT_URL_PROD : env.CLIENT_URL_DEV;
    return new URL(pathAndQuery, base).toString();
}
