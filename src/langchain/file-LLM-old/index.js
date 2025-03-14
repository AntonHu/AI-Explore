const { LLM } = require('langchain-core/language_models/llms'); // 从 langchain-core 导入 LLM 基类
const { Tool } = require('langchain/tools');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { BufferMemory } = require('langchain/memory');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 将 Ollama 包装成 LangChain 兼容的 LLM 类
class OllamaLLM extends LLM {
    constructor(modelName) {
        super({});
        this.modelName = modelName;
        this.apiUrl = 'http://localhost:11434/api/generate';
    }

    async _call(prompt) {
        try {
            const response = await axios.post(this.apiUrl, {
                model: this.modelName,
                prompt: prompt,
                stream: false, // 是否流式输出
            });
            return response.data.response;
        } catch (error) {
            console.error('Error:', error.message);
            return null;
        }
    }

    _llmType() {
        return 'ollama';
    }
}

// 初始化 Ollama 模型
const model = new OllamaLLM('deepseek-r1:7b');

// 自定义工具：读取文件夹结构
class ReadFolderTool extends Tool {
    constructor() {
        super();
        this.name = 'read-folder';
        this.description = '读取文件夹结构并返回内容。';
    }

    async _call(folderPath) {
        try {
            const items = fs.readdirSync(folderPath);
            const structure = items.map(item => {
                const itemPath = path.join(folderPath, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();
                return {
                    name: item,
                    type: isDirectory ? '文件夹' : '文件',
                };
            });
            return JSON.stringify(structure); // 确保返回正确数据
        } catch (error) {
            return `错误：${error.message}`;
        }
    }
}

// 初始化工具
const tools = [new ReadFolderTool()];

// 初始化带记忆的 Agent
async function initializeAgent() {
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: 'zero-shot-react-description',
        verbose: true, // 打印详细日志
        memory: new BufferMemory(), // 存储对话历史
        prefix: '你是一个智能助手，能够帮助用户解决问题。请调用适当的工具完成任务。请用中文回答。',
        suffix: '问题：{input}\n助手：',
    });
    return executor;
}

// 主函数
async function main() {
    const executor = await initializeAgent();

    // 启动交互式对话
    while (true) {
        const userInput = await new Promise((resolve) => {
            process.stdout.write('你: ');
            process.stdin.once('data', (data) => resolve(data.toString().trim()));
        });

        if (userInput.toLowerCase() === '退出') {
            console.log('再见！');
            break;
        }

        // 执行 Agent
        const result = await executor.run(userInput);
        console.log('助手:', result);
    }
}

// 运行主函数
main();