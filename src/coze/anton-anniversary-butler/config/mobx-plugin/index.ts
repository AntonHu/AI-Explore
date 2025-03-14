import fs from "fs";
import { isArray, isString } from "@tarojs/shared";

import type { IPluginContext, TaroPlatformBase } from "@tarojs/service";

export default function (ctx: IPluginContext) {
  ctx.registerMethod({
    name: "onSetupClose",
    fn(platform: TaroPlatformBase) {
      fs.writeFileSync(
        "./node_modules/@coze/taro-api/runtime.js",
        `window.Symbol = Symbol
window.Map = Map
window.Set = Set`
      );
      const injectedPath = "@coze/taro-api/runtime.js";
      console.log("injectedPath", injectedPath);
      if (isArray(platform.runtimePath)) {
        platform.runtimePath.push(injectedPath);
      } else if (isString(platform.runtimePath)) {
        platform.runtimePath = [platform.runtimePath, injectedPath];
      }
    },
  });
}
