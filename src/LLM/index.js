import axios from "axios";
import readline from "readline";
import { showLoading, hideLoading } from "./loading.js";
import chalk from "chalk";
import ansiEscapes from "ansi-escapes";

// Ollama API 的地址
const OLLAMA_API_URL = "http://localhost:11434/api/generate";

/*
 * 与大模型对话的函数（流式返回）
 * @param {string} prompt - 用户输入的提示词
 * @param {function} onData - 处理接收到的数据回调函数
 * @param {function} onEnd - 处理数据接收完毕的回调函数
 */
async function chatWithModelStream(prompt, onData, onEnd) {
  try {
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: "deepseek-coder-v2:latest", // 模型名称
        prompt: prompt, // 用户输入
        stream: true, // 启用流式返回
      },
      {
        responseType: "stream", // 设置响应类型为流
      }
    );

    // 监听数据流
    response.data.on("data", (chunk) => {
      const jsonString = chunk.toString().trim();
      if (jsonString) {
        const data = JSON.parse(jsonString);
        onData(data);
      }
    });

    // 监听流结束
    response.data.on("end", () => {
      onEnd();
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

const rl = readline.createInterface({
  input: process.stdin, // 标准输入流
  output: process.stdout, // 标准输出流
});

// 启动交互式对话
let fullResponse = ""; // 将 fullResponse 移动到 startChat 函数外部
function startChat() {
  rl.question(chalk.blue("你好！请问你想聊什么？ "), async (userInput) => {
    if (userInput.toLowerCase() === "退出") {
      console.log(chalk.green("再见！"));
      rl.close();
      return;
    }

    // 显示 Loading
    const loadingInterval = showLoading();

    // 调用大模型生成回复（流式）
    // let fullResponse = ''; // 删除 startChat 函数内部的 fullResponse 定义
    await chatWithModelStream(
      userInput,
      (data) => {
        // 处理每条数据
        if (data.response) {
          fullResponse += data.response;
          // 清除当前行并写入新内容
          readline.clearLine(process.stdout, 0); // 清除当前行
          readline.cursorTo(process.stdout, 0); // 将光标移动到行首
          process.stdout.write(chalk.yellow(`模型回复: ${fullResponse}`)); // 使用 chalk 写入新内容
        }
      },
      () => {
        // 流结束时隐藏 Loading
        hideLoading(loadingInterval);
        startChat(); // 继续对话
      }
    );
  });
}

// 开始对话
startChat();
