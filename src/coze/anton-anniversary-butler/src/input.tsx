import { View, Text, Input as AtInput } from "@tarojs/components";
import {
  useViewModelState,
  useRefMethods,
} from "@coze-kit/ui-builder-component-runtime-sdk";

const Input = () => {
  const [value, setValue] = useViewModelState("input default value", "value");
  useRefMethods({ setValue });
  return (
    <View>
      <Text>label: </Text>
      <AtInput
        defaultValue={value}
        onInput={(v) => setValue(v.detail.value)}
      ></AtInput>
    </View>
  );
};

export { Input };
