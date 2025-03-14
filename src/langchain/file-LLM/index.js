import { ChatOllama } from "@langchain/ollama";
import { HumanMessage } from "@langchain/core/messages";
import tools from "./tools.js";
import { functionCallTemplate } from "./templates.js";
import readline from "readline";

// 初始化 Ollama 模型
const model = new ChatOllama({
  model: "deepseek-coder-v2",
  temperature: 0.1,
  verbose: false,
});

// 绑定工具
const modelWithTools = model.bindTools(tools);

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 与模型对话的函数
async function chatWithModel() {
  rl.question("请输入你的问题（输入 'exit' 退出）：", async (userInput) => {
    if (userInput.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    let response, toolCall;

    try {
      // 调用模型
      response = await modelWithTools.invoke([new HumanMessage(userInput)]);
      if (response && response.tool_calls && response.tool_calls.length > 0) {
        toolCall = response.tool_calls[0];
      }
    } catch (err) {
      try {
        // 如果模型不支持工具调用，使用自定义模板
        response = await model.invoke([
          new HumanMessage(
            functionCallTemplate.replace("{question}", userInput)
          ),
        ]);
        toolCall = JSON.parse(response.content.replace(/```json|```/g, ""));
      } catch (err) {
        // console.log("🚀 ~ rl.question ~ err:", err);
      }
    }

    // 解析工具调用结果
    if (toolCall) {
      const toolName = toolCall.name;
      const toolInput = toolCall.args;
      const tool = tools.find((t) => t.name === toolName);

      if (tool) {
        const toolResult = await tool._call(JSON.stringify(toolInput));
        console.log(`工具 ${toolName} 调用结果:\n ${toolResult}`);
        const response = await model.invoke([
          new HumanMessage(
            `根据用户的问题 ${userInput} ，你成功使用工具 ${toolName} 获得了相关的结果： ${toolResult}。现在请整理成容易理解的回答告知用户`
          ),
        ]);
        console.log(response.content);
      } else {
        console.log(`未找到工具: ${toolName}`);
      }
    } else {
      console.log(`模型直接回复: ${response.content}`);
    }

    // 继续对话
    chatWithModel();
  });
}

// 启动对话
chatWithModel();
