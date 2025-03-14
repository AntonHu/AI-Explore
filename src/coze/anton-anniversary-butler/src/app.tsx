import {
  registerExternals,
  getExternals,
  COMPONENT_RUNTIME_SDK,
} from "@/sdk-init";
import { elementViewModelContext, elementViewModel } from "@/elementStates";
import states from "@/states";

import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    const cozeAPI = states.initCozeApiClient(""); // 填写token

    registerExternals(COMPONENT_RUNTIME_SDK, {
      ...(getExternals(COMPONENT_RUNTIME_SDK) || {}),
      cozeAPIClient: states.cozeApiClient,
      usePlatformContext: () => ({
        isPreview: true,
        isDraft: false,
        projectId: states.app_id, // 填写coze project id
        connectorId: states.connector_id, // 填写用户 id
        token: cozeAPI.token,
        refreshToken: () => cozeAPI.refreshToken(),
        chatHost: "https://www.coze.cn/ui-builder/chat?ui_chat=1",
        userId: "", // 填写用户 id
        getUserInfo: () =>
          ({
            nickName: "",
            avatarUrl: "",
          } || null), // 用户信息
      }),
    });
    console.log("App launched .");
  });

  // children 是将要会渲染的页面
  return (
    <elementViewModelContext.Provider value={elementViewModel}>
      {children}
    </elementViewModelContext.Provider>
  );
}

export default App;
