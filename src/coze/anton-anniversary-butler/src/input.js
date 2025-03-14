"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const components_1 = require("@tarojs/components");
const ui_builder_component_runtime_sdk_1 = require("@coze-kit/ui-builder-component-runtime-sdk");
const Input = () => {
    const [value, setValue] = (0, ui_builder_component_runtime_sdk_1.useViewModelState)("input default value", "value");
    (0, ui_builder_component_runtime_sdk_1.useRefMethods)({ setValue });
    return (<components_1.View>
      <components_1.Text>label: </components_1.Text>
      <components_1.Input defaultValue={value} onInput={(v) => setValue(v.detail.value)}></components_1.Input>
    </components_1.View>);
};
exports.Input = Input;
