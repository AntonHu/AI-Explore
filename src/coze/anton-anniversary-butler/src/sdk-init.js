"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternals = exports.getAllExternals = exports.registerExternals = exports.COMPONENT_RUNTIME_SDK = void 0;
const elementStates_1 = require("@/elementStates");
// 兼容微信/字节小程序
function getGlobal() {
    if (typeof globalThis !== "undefined") {
        return globalThis;
    }
    if (typeof window !== "undefined") {
        return window;
    }
}
const _global = getGlobal();
exports.COMPONENT_RUNTIME_SDK = "@coze-kit/ui-builder-component-runtime-sdk";
const registerExternals = (key, externals) => {
    if (!_global.__BUILDER__COMPONENT__EXTERNAL__) {
        _global.__BUILDER__COMPONENT__EXTERNAL__ = {};
    }
    _global.__BUILDER__COMPONENT__EXTERNAL__[key] = externals;
};
exports.registerExternals = registerExternals;
const getAllExternals = () => _global.__BUILDER__COMPONENT__EXTERNAL__;
exports.getAllExternals = getAllExternals;
const getExternals = (key) => (0, exports.getAllExternals)()?.[key];
exports.getExternals = getExternals;
(0, exports.registerExternals)(exports.COMPONENT_RUNTIME_SDK, {
    useViewModelState: elementStates_1.useViewModelState,
    useRefMethods: elementStates_1.useRefMethods,
});
