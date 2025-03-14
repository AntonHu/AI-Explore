"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_init_1 = require("@/sdk-init");
const elementStates_1 = require("@/elementStates");
const states_1 = __importDefault(require("@/states"));
const taro_1 = require("@tarojs/taro");
function App({ children }) {
    (0, taro_1.useLaunch)(() => {
        const cozeAPI = states_1.default.initCozeApiClient(""); // 填写token
        (0, sdk_init_1.registerExternals)(sdk_init_1.COMPONENT_RUNTIME_SDK, {
            ...((0, sdk_init_1.getExternals)(sdk_init_1.COMPONENT_RUNTIME_SDK) || {}),
            cozeAPIClient: states_1.default.cozeApiClient,
            usePlatformContext: () => ({
                isPreview: true,
                isDraft: false,
                projectId: states_1.default.app_id, // 填写coze project id
                connectorId: states_1.default.connector_id, // 填写用户 id
                token: cozeAPI.token,
                refreshToken: () => cozeAPI.refreshToken(),
                chatHost: "https://www.coze.cn/ui-builder/chat?ui_chat=1",
                userId: "", // 填写用户 id
                getUserInfo: () => ({
                    nickName: "",
                    avatarUrl: "",
                } || null), // 用户信息
            }),
        });
        console.log("App launched .");
    });
    // children 是将要会渲染的页面
    return (<elementStates_1.elementViewModelContext.Provider value={elementStates_1.elementViewModel}>
      {children}
    </elementStates_1.elementViewModelContext.Provider>);
}
exports.default = App;
