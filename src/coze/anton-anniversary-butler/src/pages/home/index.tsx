import { Page, Chat } from "@coze-kit/ui-builder-components-mp";
import { ScopeContext, elementViewModel } from "@/elementStates";

import {
  useLoad,
  getCurrentInstance,
  useShareAppMessage,
  useDidShow,
  useShareTimeline,
} from "@tarojs/taro";
import { observer } from "mobx-react-lite";
import { usePageEvents, getPageEvent } from "@/utils/use-page-events";

import states from "@/states";

function Index() {
  const query = getCurrentInstance().router?.params;

  useLoad(() => {
    console.log("Page loaded.");
    states.query = query;
  });

  usePageEvents();
  // 分享放在 usePageEvents 中会不生效
  useShareAppMessage(() => {
    getPageEvent()?.onShareAppMessage?.();
    return {};
  });

  useShareTimeline(() => {
    getPageEvent()?.onShareAppMessage?.();
    return {};
  });

  return (
    <>
      <ScopeContext.Provider value={{ id: "Page1" }}>
        <Page
          {...{
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
          }}
          id={"Page1"}
        >
          <ScopeContext.Provider value={{ id: "Chat1" }}>
            <Chat
              {...{
                workflowId: (function () {
                  try {
                    return (function () {
                      "use strict";

                      return states.chat.workflowId;
                    })();
                  } catch (err) {
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
                    } catch (err) {
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
              }}
              id={"Chat1"}
            ></Chat>
          </ScopeContext.Provider>
        </Page>
      </ScopeContext.Provider>
    </>
  );
}

export default observer(Index);
