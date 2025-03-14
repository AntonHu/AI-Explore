const config = defineAppConfig({
  pages: ["pages/home/index", "pages/webview/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  tabBar: { selectedColor: "#5243FF", backgroundColor: "#ffffff", list: [] },
});

export default config;
