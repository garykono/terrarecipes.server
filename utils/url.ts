// utils/url.js
import  { URL } from "url";
export const buildFrontendUrl = (pathAndQuery: string) => {
    const base = process.env.NODE_ENV === "production" ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV;
    return new URL(pathAndQuery, base).toString();
}
