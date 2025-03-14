((global) => {
    let zip
    let videoList = []

    const getVideoList = () => {
        const videoElements = document.getElementsByTagName('video')
        Array.from(videoElements).forEach((item) => {
            item.className && videoList.unshift(item.src)
        })
        return videoList
    }

    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const downloadZip = async (fileName) => {
        // 动态加载 JSZip 和 FileSaver.js
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js");

        // 创建 JSZip 实例
        zip = new JSZip();

        // 下载图片并添加到 zip
        for (let i = 0; i < videoList.length; i++) {
            const url = videoList[i];
            global.console.log(`开始下载：第${i + 1}个视频`)
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(`分镜视频${i + 1}.mp4`, blob);
            global.console.log(`完成下载：第${i + 1}个视频`)
        }

        // 生成 zip 文件并触发下载
        global.console.log('开始打包：文件压缩中...')
        zip.generateAsync({ type: "blob" }).then((content) => {
            global.console.log('完成打包：开始下载...')
            saveAs(content, `${fileName}.zip`);
            global.console.log('完成所有任务！')
        });
    }

    const init = () => {
        getVideoList()
        downloadZip('分镜视频合集')
    }

    init()
})(window)