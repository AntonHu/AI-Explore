import { WebView } from "@tarojs/components";
import { useLoad } from "@tarojs/taro";

import { useState } from "react";

function Index() {
  const [url, setUrl] = useState("");
  useLoad((options) => {
    const targetUrl = decodeURIComponent(options.url);
    console.log("xxx targetUrl: ", targetUrl);
    setUrl(targetUrl);
  });
  return <WebView src={url} style={{ height: "100vh", width: "100vw" }} />;
}

export default Index;
