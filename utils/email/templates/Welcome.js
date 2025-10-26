"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
exports.Welcome = ({ name }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { style: { fontFamily: "ui-sans-serif, system-ui" }, children: [(0, jsx_runtime_1.jsxs)("h2", { children: ["Welcome, ", name, "!"] }), (0, jsx_runtime_1.jsx)("p", { children: "Thanks for joining our recipe site." })] }));
};
