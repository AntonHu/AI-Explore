"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
function Index() {
    const [url, setUrl] = (0, react_1.useState)("");
    (0, taro_1.useLoad)((options) => {
        const targetUrl = decodeURIComponent(options.url);
        console.log("xxx targetUrl: ", targetUrl);
        setUrl(targetUrl);
    });
    return <components_1.WebView src={url} style={{ height: "100vh", width: "100vw" }}/>;
}
exports.default = Index;
