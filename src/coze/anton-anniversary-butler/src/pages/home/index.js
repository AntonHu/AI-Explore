"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ui_builder_components_mp_1 = require("@coze-kit/ui-builder-components-mp");
const elementStates_1 = require("@/elementStates");
const taro_1 = require("@tarojs/taro");
const mobx_react_lite_1 = require("mobx-react-lite");
const use_page_events_1 = require("@/utils/use-page-events");
const states_1 = __importDefault(require("@/states"));
function Index() {
    const query = (0, taro_1.getCurrentInstance)().router?.params;
    (0, taro_1.useLoad)(() => {
        console.log("Page loaded.");
        states_1.default.query = query;
    });
    (0, use_page_events_1.usePageEvents)();
    // 分享放在 usePageEvents 中会不生效
    (0, taro_1.useShareAppMessage)(() => {
        (0, use_page_events_1.getPageEvent)()?.onShareAppMessage?.();
        return {};
    });
    (0, taro_1.useShareTimeline)(() => {
        (0, use_page_events_1.getPageEvent)()?.onShareAppMessage?.();
        return {};
    });
    return (<>
      <elementStates_1.ScopeContext.Provider value={{ id: "Page1" }}>
        <ui_builder_components_mp_1.Page {...{
        enableNav: true,
        title: "纪念日管家",
        style: {
            flexFlow: "column",
            gap: 16,
            justifyContent: "start",
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: 0,
            padding: 16,
            width: "100%",
        },
    }} id={"Page1"}>
          <elementStates_1.ScopeContext.Provider value={{ id: "Chat1" }}>
            <ui_builder_components_mp_1.Chat {...{
        workflowId: (function () {
            try {
                return (function () {
                    "use strict";
                    return states_1.default.chat.workflowId;
                })();
            }
            catch (err) {
                console.error(err);
            }
        })(),
        workflowParams: {
            CONVERSATION_NAME: (function () {
                try {
                    return (function () {
                        "use strict";
                        return void 0;
                    })();
                }
                catch (err) {
                    console.error(err);
                }
            })(),
        },
        chatRole: {
            botIconUrlBind: null,
            botName: null,
            botDesc: null,
            prologue: null,
            suggestions: null,
            suggestionsPrompt: null,
            backgroundImg: null,
        },
        style: {
            width: "100%",
            height: "100%",
            flex: 1,
        },
    }} id={"Chat1"}></ui_builder_components_mp_1.Chat>
          </elementStates_1.ScopeContext.Provider>
        </ui_builder_components_mp_1.Page>
      </elementStates_1.ScopeContext.Provider>
    </>);
}
exports.default = (0, mobx_react_lite_1.observer)(Index);
