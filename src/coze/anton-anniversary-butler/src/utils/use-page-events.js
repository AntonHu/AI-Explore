"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePageEvents = exports.getPageEvent = void 0;
const taro_1 = __importStar(require("@tarojs/taro"));
const getPageEvent = () => {
    // @ts-expect-error 暂时忽略
    return taro_1.default.getCurrentInstance().page?.pageEvent;
};
exports.getPageEvent = getPageEvent;
const usePageEvents = () => {
    (0, taro_1.usePageScroll)(() => {
        (0, exports.getPageEvent)()?.onPageScroll?.();
    });
    (0, taro_1.useReachBottom)(() => {
        (0, exports.getPageEvent)()?.onReachBottom?.();
    });
    (0, taro_1.usePullDownRefresh)(() => {
        const result = (0, exports.getPageEvent)()?.onPullDownRefresh?.();
        if (result instanceof Promise) {
            result.then(() => {
                taro_1.default.stopPullDownRefresh();
            });
        }
        else {
            taro_1.default.stopPullDownRefresh();
        }
    });
};
exports.usePageEvents = usePageEvents;
