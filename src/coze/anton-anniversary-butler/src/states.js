"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ui_builder_components_mp_1 = require("@coze-kit/ui-builder-components-mp");
const elementStates_1 = require("@/elementStates");
const chat_1 = __importDefault(require("@/data-sources/chat"));
const api_1 = require("@coze/api");
const taro_api_1 = require("@coze/taro-api");
const taro_1 = require("@tarojs/taro");
const qs_1 = __importDefault(require("qs"));
const mobx_1 = require("mobx");
class States {
    initCozeApiClient = (token) => {
        this.cozeApiClient = new taro_api_1.CozeAPI({
            baseURL: api_1.COZE_CN_BASE_URL,
            token: token,
            headers: {
                "X-TT-ENV": "prod",
                "X-USE-PPE": 1,
            },
        });
        return this.cozeApiClient;
    };
    cozeApiClient = null;
    AbortController = taro_api_1.AbortController;
    app_id = "";
    connector_id_list = {
        tt: "10000130",
        weapp: "10000131",
    };
    connector_id = this.connector_id_list[process.env.TARO_ENV];
    showModal = (payload) => {
        console.log("[showModal]", payload);
        const { content, showCancel, confirmText } = payload;
        (0, ui_builder_components_mp_1.showModal)?.({
            content,
            showCancel,
            confirmText,
        });
    };
    navigation = (payload) => {
        const routes = [
            {
                path: "/home",
                title: "首页",
                isHome: true,
                pageId: "pg_jRHfJHLmTd",
                miniAppTitle: "纪念日管家",
            },
        ];
        const tabbar = {
            selectedColor: "#5243FF",
            backgroundColor: "#ffffff",
            list: [],
        };
        const { navType, navUrl, pageId, searchParams } = payload;
        if (navType === "outer" && navUrl) {
            (0, taro_1.navigateTo)({
                url: `/pages/webview/index?url=${encodeURIComponent(navUrl)}`,
            });
        }
        else if (navType === "inner" && pageId) {
            const route = routes.find((it) => it.pageId === pageId);
            if (route) {
                const navigateFunc = tabbar.list.find((it) => it.pagePath === `pages${route.path}/index`)
                    ? taro_1.switchTab
                    : taro_1.navigateTo;
                navigateFunc({
                    url: `/pages${route.path}/index${searchParams ? "?" + qs_1.default.stringify(searchParams) : ""}`,
                });
            }
        }
    };
    toast = (payload) => {
        console.log("[showToast]", payload);
        const { toastContent, toastType, toastDuration } = payload;
        (0, ui_builder_components_mp_1.showToast)?.({
            title: String(toastContent),
            icon: toastType === "info" ? "none" : toastType,
            duration: toastDuration,
        });
    };
    componentRefMethod = (payload) => {
        const { blockId = "", refMethodName = "", refMethodParams = [] } = payload;
        try {
            console.info("[callComponentRefMethod] payload=", payload);
            this[blockId]?.[refMethodName]?.(...refMethodParams);
        }
        catch (ex) {
            console.error(ex);
        }
    };
    workflow = async (payload) => {
        const { workflowId, workflowPayload, errorMessage, successMessage } = payload;
        const workflow = this?.[workflowId];
        try {
            const ds = await workflow?.trigger(workflowPayload);
            if (ds?.error && errorMessage) {
                this.showModal({
                    content: errorMessage,
                    showCancel: false,
                    confirmText: "确认",
                });
            }
            else if (!ds?.error && successMessage) {
                this.toast({
                    toastContent: successMessage,
                    toastDurationType: "auto",
                    toastDuration: 2000,
                    toastType: "success",
                });
            }
        }
        catch (ex) {
            console.error(ex);
            console.log("call workflow error message ->", errorMessage);
        }
    };
    get Chat1() {
        return elementStates_1.elementViewModel.states["Chat1"];
    }
    get Page1() {
        return elementStates_1.elementViewModel.states["Page1"];
    }
    get Navigation1() {
        return elementStates_1.elementViewModel.states["Navigation1"];
    }
    chat = (0, chat_1.default)(this);
    test = 1;
    constructor() {
        (0, mobx_1.makeObservable)(this, {
            test: mobx_1.observable,
            initCozeApiClient: mobx_1.action,
            cozeApiClient: mobx_1.observable,
            AbortController: mobx_1.observable,
            app_id: mobx_1.observable,
            connector_id_list: mobx_1.observable,
            connector_id: mobx_1.observable,
            showModal: mobx_1.action,
            navigation: mobx_1.action,
            toast: mobx_1.action,
            componentRefMethod: mobx_1.action,
            workflow: mobx_1.action,
            Chat1: mobx_1.computed,
            Page1: mobx_1.computed,
            Navigation1: mobx_1.computed,
            chat: mobx_1.observable,
        });
    }
}
const states = new States();
global.states = states;
console.log("states", states);
exports.default = states;
