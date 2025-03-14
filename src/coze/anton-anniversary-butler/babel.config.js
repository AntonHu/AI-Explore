// @ts-nocheck
/* eslint-disable */
// babel-preset-taro 更多选项和默认值：
// https://github.com/NervJS/taro/blob/next/packages/babel-preset-taro/README.md
// taro/packages/babel-preset-taro/README.md at main · NervJS/taro
module.exports = {
  presets: [
    [
      "taro",
      {
        framework: "react",
        ts: true,
        compiler: "webpack5",
        useBuiltIns: process.env.TARO_ENV === "h5" ? "usage" : false,
        // loose: true,
      },
    ],
  ],
};
/* eslint-enable */
