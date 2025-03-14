((global) => {
    const LIST_CLASS_NAME = "ui-builder-flex-none"
    const TEXT_CLASS_NAME = "ui-builder-text"
    const IMAGE_CLASS_NAME = "ui-builder-image"

    let zip
    let storyboardList = []
    let contentList = []
    let imageList = []
    let promptList = []
    let videoPromptList = []

    const getStoryBoardList = (className = LIST_CLASS_NAME) => {
        const domList = document.querySelectorAll(`.${className}`)
        storyboardList = Array.from(domList)
        return storyboardList
    }
    const getTitle = () => {
        const listWrapper = storyboardList[0].parentElement
        const timeDom = listWrapper.previousElementSibling
        const titleDom = timeDom.previousElementSibling
        return `${titleDom.innerText} ${timeDom.innerText}`
    }
    const getContent = (item, className = TEXT_CLASS_NAME) => {
        return item.querySelectorAll(`.${className}`)[1].innerText
    }
    const getImageUrl = (item, className = IMAGE_CLASS_NAME) => {
        return item.querySelector(`.${className}`).children[0].src
    }
    const getPrompt = (item) => {
        return item.children[2].children[1].children[1].innerText
    }
    const getVideoPrompt = (item) => {
        return item.children[2].children[1].children[3].innerText
    }
    const formatData = (list) => {
        list.forEach(item => {
            contentList.push(getContent(item))
            imageList.push(getImageUrl(item))
            promptList.push(getPrompt(item))
            videoPromptList.push(getVideoPrompt(item))
        })
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
  
    downloadTextFile = (stringArray, fileName) => {
        // 将字符串数组以两个回车换行拼接
        const textContent = stringArray.join('\n\n');
        // 创建Blob对象
        zip.file(`${fileName}.txt`, textContent);
    }

    const downloadFiles = async (fileName) => {
        // 动态加载 JSZip 和 FileSaver.js
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js");

        // 创建 JSZip 实例
        zip = new JSZip();

        // 下载图片并添加到 zip
        for (let i = 0; i < imageList.length; i++) {
            const url = imageList[i];
            global.console.log(`开始下载：第${i + 1}个分镜图片`)
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(`分镜图片${i + 1}.png`, blob);
            global.console.log(`完成下载：第${i + 1}个分镜图片`)
        }

        // 字幕
        global.console.log(`开始下载：字幕`)
        downloadTextFile(contentList, '字幕')
        global.console.log(`完成下载：字幕`)
        // 分镜描述
        global.console.log(`开始下载：分镜描述`)
        downloadTextFile(promptList, '分镜描述')
        global.console.log(`完成下载：分镜描述`)
        // 视频描述
        global.console.log(`开始下载：视频描述`)
        downloadTextFile(videoPromptList, '视频描述')
        global.console.log(`完成下载：视频描述`)


        // 生成 zip 文件并触发下载
        global.console.log('开始打包：文件压缩中...')
        zip.generateAsync({ type: "blob" }).then((content) => {
            global.console.log('完成打包：开始下载...')
            saveAs(content, `${fileName}.zip`);
            global.console.log('完成所有任务！')
        });
    }

    const init = () => {
        const list = getStoryBoardList()
        const title = getTitle()
        formatData(list)
        downloadFiles(title)
    }

    init()
})(window)