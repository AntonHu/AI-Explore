import { useViewModelState, useRefMethods } from "@/elementStates";

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

export const COMPONENT_RUNTIME_SDK =
  "@coze-kit/ui-builder-component-runtime-sdk";

export const registerExternals = (key: string, externals) => {
  if (!_global.__BUILDER__COMPONENT__EXTERNAL__) {
    _global.__BUILDER__COMPONENT__EXTERNAL__ = {};
  }
  _global.__BUILDER__COMPONENT__EXTERNAL__[key] = externals;
};

export const getAllExternals = () => _global.__BUILDER__COMPONENT__EXTERNAL__;

export const getExternals = (key: string) => getAllExternals()?.[key];

registerExternals(COMPONENT_RUNTIME_SDK, {
  useViewModelState,
  useRefMethods,
});
