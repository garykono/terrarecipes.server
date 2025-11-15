// utils/url.js
const { URL } = require("url");
exports.buildFrontendUrl = (pathAndQuery) => {
    const base = process.env.NODE_ENV === "production" ? process.env.CLIENT_URL_PROD : process.env.CLIENT_URL_DEV;
    return new URL(pathAndQuery, base).toString();
}
