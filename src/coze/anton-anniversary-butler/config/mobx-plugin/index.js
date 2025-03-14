"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fs_1 = __importDefault(require("fs"));
const shared_1 = require("@tarojs/shared");
function default_1(ctx) {
    ctx.registerMethod({
        name: "onSetupClose",
        fn(platform) {
            fs_1.default.writeFileSync("./node_modules/@coze/taro-api/runtime.js", `window.Symbol = Symbol
window.Map = Map
window.Set = Set`);
            const injectedPath = "@coze/taro-api/runtime.js";
            console.log("injectedPath", injectedPath);
            if ((0, shared_1.isArray)(platform.runtimePath)) {
                platform.runtimePath.push(injectedPath);
            }
            else if ((0, shared_1.isString)(platform.runtimePath)) {
                platform.runtimePath = [platform.runtimePath, injectedPath];
            }
        },
    });
}
