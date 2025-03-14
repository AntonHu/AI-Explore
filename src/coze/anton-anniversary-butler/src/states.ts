import {
  Chat,
  Page,
  Navigation,
  showToast,
  showModal,
} from "@coze-kit/ui-builder-components-mp";
import { ScopeContext, elementViewModel } from "@/elementStates";
import createchat from "@/data-sources/chat";
import { COZE_CN_BASE_URL } from "@coze/api";
import { CozeAPI, AbortController } from "@coze/taro-api";
import WorkflowDataSource from "@/data-sources/_workflow";
import cozeApi from "@/data-sources/_coze-api";
import { navigateTo, switchTab } from "@tarojs/taro";
import qs from "qs";

import { makeObservable, observable, action, computed } from "mobx";

class States {
  initCozeApiClient = (token) => {
    this.cozeApiClient = new CozeAPI({
      baseURL: COZE_CN_BASE_URL,
      token: token,
      headers: {
        "X-TT-ENV": "prod",
        "X-USE-PPE": 1,
      },
    });
    return this.cozeApiClient;
  };
  cozeApiClient = null;
  AbortController = AbortController;
  app_id = "";
  connector_id_list = {
    tt: "10000130",
    weapp: "10000131",
  };
  connector_id = this.connector_id_list[process.env.TARO_ENV];
  showModal = (payload) => {
    console.log("[showModal]", payload);
    const { content, showCancel, confirmText } = payload;
    showModal?.({
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
      navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(navUrl)}`,
      });
    } else if (navType === "inner" && pageId) {
      const route = routes.find((it) => it.pageId === pageId);
      if (route) {
        const navigateFunc = tabbar.list.find(
          (it) => it.pagePath === `pages${route.path}/index`
        )
          ? switchTab
          : navigateTo;
        navigateFunc({
          url: `/pages${route.path}/index${
            searchParams ? "?" + qs.stringify(searchParams) : ""
          }`,
        });
      }
    }
  };
  toast = (payload) => {
    console.log("[showToast]", payload);
    const { toastContent, toastType, toastDuration } = payload;
    showToast?.({
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
    } catch (ex) {
      console.error(ex);
    }
  };
  workflow = async (payload) => {
    const { workflowId, workflowPayload, errorMessage, successMessage } =
      payload;
    const workflow = this?.[workflowId];
    try {
      const ds = await workflow?.trigger(workflowPayload);
      if (ds?.error && errorMessage) {
        this.showModal({
          content: errorMessage,
          showCancel: false,
          confirmText: "确认",
        });
      } else if (!ds?.error && successMessage) {
        this.toast({
          toastContent: successMessage,
          toastDurationType: "auto",
          toastDuration: 2000,
          toastType: "success",
        });
      }
    } catch (ex) {
      console.error(ex);
      console.log("call workflow error message ->", errorMessage);
    }
  };
  get Chat1() {
    return elementViewModel.states["Chat1"];
  }
  get Page1() {
    return elementViewModel.states["Page1"];
  }
  get Navigation1() {
    return elementViewModel.states["Navigation1"];
  }
  chat = createchat(this);

  test = 1;

  constructor() {
    makeObservable(this, {
      test: observable,
      initCozeApiClient: action,
      cozeApiClient: observable,
      AbortController: observable,
      app_id: observable,
      connector_id_list: observable,
      connector_id: observable,
      showModal: action,
      navigation: action,
      toast: action,
      componentRefMethod: action,
      workflow: action,
      Chat1: computed,
      Page1: computed,
      Navigation1: computed,
      chat: observable,
    });
  }
}

const states = new States();
global.states = states;
console.log("states", states);

export default states;
