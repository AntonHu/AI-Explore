import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
// 定义工具列表，避免重复定义
const TOOLS = [
    {
        name: "puppeteer_navigate",
        description: "导航到指定的 URL",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" },
            },
            required: ["url"],
        },
    },
    {
        name: "puppeteer_screenshot",
        description: "截取当前页面或指定元素的屏幕截图",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "截图的名称" },
                selector: {
                    type: "string",
                    description: "用于截图的 CSS 选择器",
                },
                width: {
                    type: "number",
                    description: "截图的宽度（像素，默认为 800）",
                },
                height: {
                    type: "number",
                    description: "截图的高度（像素，默认为 600）",
                },
            },
            required: ["name"],
        },
    },
    {
        name: "puppeteer_click",
        description: "点击页面上的元素",
        inputSchema: {
            type: "object",
            properties: {
                selector: {
                    type: "string",
                    description: "用于点击的 CSS 选择器",
                },
            },
            required: ["selector"],
        },
    },
    {
        name: "puppeteer_fill",
        description: "填充输入字段",
        inputSchema: {
            type: "object",
            properties: {
                selector: {
                    type: "string",
                    description: "输入字段的 CSS 选择器",
                },
                value: { type: "string", description: "要填充的值" },
            },
            required: ["selector", "value"],
        },
    },
    {
        name: "puppeteer_select",
        description: "使用 Select 标签选择页面上的元素",
        inputSchema: {
            type: "object",
            properties: {
                selector: {
                    type: "string",
                    description: "用于选择的 CSS 选择器",
                },
                value: { type: "string", description: "要选择的值" },
            },
            required: ["selector", "value"],
        },
    },
    {
        name: "puppeteer_hover",
        description: "悬停在页面上的元素上",
        inputSchema: {
            type: "object",
            properties: {
                selector: {
                    type: "string",
                    description: "用于悬停的 CSS 选择器",
                },
            },
            required: ["selector"],
        },
    },
    {
        name: "puppeteer_evaluate",
        description: "在浏览器控制台中执行 JavaScript 代码",
        inputSchema: {
            type: "object",
            properties: {
                script: { type: "string", description: "要执行的 JavaScript 代码" },
            },
            required: ["script"],
        },
    },
];
// 全局状态
let browser; // Puppeteer 浏览器实例
let page; // Puppeteer 页面实例
const consoleLogs = []; // 存储浏览器控制台日志
const screenshots = new Map(); // 存储屏幕截图，键为名称，值为 base64 编码的图像数据
/**
 * 确保浏览器实例存在，如果不存在则启动一个新的浏览器实例
 * @returns {Promise<Page>} 返回 Puppeteer 页面实例
 */
async function ensureBrowser() {
    if (!browser) {
        // 根据环境变量判断是否在 Docker 容器中运行，选择不同的启动参数
        const npx_args = { headless: false }; // npx 运行时的参数，显示浏览器界面
        const docker_args = {
            headless: true, // Docker 容器中的参数，无头模式运行
            args: ["--no-sandbox", "--single-process", "--no-zygote"], // 禁用沙箱、单进程模式、禁用 zygote
        };
        browser = await puppeteer.launch(process.env.DOCKER_CONTAINER ? docker_args : npx_args // 根据环境变量选择不同的参数
        );
        const pages = await browser.pages(); // 获取所有页面
        page = pages[0]; // 获取第一个页面
        // 监听控制台消息
        page.on("console", (msg) => {
            const logEntry = `[${msg.type()}] ${msg.text()}`; // 格式化日志条目
            consoleLogs.push(logEntry); // 添加到日志数组
            server.notification({
                // 发送通知，告知控制台日志已更新
                method: "notifications/resources/updated",
                params: { uri: "console://logs" },
            });
        });
    }
    return page; // 返回页面实例
}
/**
 * 处理工具调用
 * @param {string} name 工具名称
 * @param {any} args 工具参数
 * @returns {Promise<CallToolResult>} 返回工具调用的结果
 */
async function handleToolCall(name, args) {
    const page = await ensureBrowser(); // 确保浏览器实例存在
    switch (name) {
        case "puppeteer_navigate":
            // 导航到指定的 URL
            await page.goto(args.url);
            return {
                content: [
                    {
                        type: "text",
                        text: `Navigated to ${args.url}`,
                    },
                ],
                isError: false,
            };
        case "puppeteer_screenshot": {
            // 截取屏幕截图
            const width = args.width ?? 800; // 获取宽度，默认为 800
            const height = args.height ?? 600; // 获取高度，默认为 600
            await page.setViewport({ width, height }); // 设置视口大小
            const screenshot = await (args.selector
                ? (await page.$(args.selector))?.screenshot({ encoding: "base64" })
                : page.screenshot({ encoding: "base64", fullPage: false })); // 截取屏幕截图，如果指定了选择器，则截取选择器对应的元素，否则截取整个页面
            if (!screenshot) {
                // 如果截图失败
                return {
                    content: [
                        {
                            type: "text",
                            text: args.selector
                                ? `Element not found: ${args.selector}`
                                : "Screenshot failed",
                        },
                    ],
                    isError: true,
                };
            }
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const screenshotDir = path.join(__dirname, "screenshots"); // 截图保存目录
            if (!fs.existsSync(screenshotDir)) {
                // 如果目录不存在，则创建目录
                fs.mkdirSync(screenshotDir);
            }
            const screenshotPath = path.join(__dirname, "screenshots", `${args.name}.png` // 截图保存路径
            );
            console.log("screenshotPath:", screenshotPath);
            fs.writeFileSync(screenshotPath, Buffer.from(screenshot, "base64") // 将截图保存到文件
            );
            screenshots.set(args.name, screenshot); // 将截图添加到 screenshots Map
            server.notification({
                // 发送通知，告知资源列表已更改
                method: "notifications/resources/list_changed",
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Screenshot '${args.name}' taken at ${width}x${height}`,
                    },
                    {
                        type: "image",
                        data: screenshot,
                        mimeType: "image/png",
                    },
                ],
                isError: false,
            };
        }
        case "puppeteer_click":
            // 点击页面上的元素
            try {
                await page.click(args.selector); // 点击选择器对应的元素
                return {
                    content: [
                        {
                            type: "text",
                            text: `Clicked: ${args.selector}`,
                        },
                    ],
                    isError: false,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to click ${args.selector}: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        case "puppeteer_fill":
            // 填充输入字段
            try {
                await page.waitForSelector(args.selector); // 等待选择器对应的元素出现
                await page.type(args.selector, args.value); // 填充输入字段
                return {
                    content: [
                        {
                            type: "text",
                            text: `Filled ${args.selector} with: ${args.value}`,
                        },
                    ],
                    isError: false,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to fill ${args.selector}: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        case "puppeteer_select":
            // 使用 Select 标签选择页面上的元素
            try {
                await page.waitForSelector(args.selector); // 等待选择器对应的元素出现
                await page.select(args.selector, args.value); // 选择元素
                return {
                    content: [
                        {
                            type: "text",
                            text: `Selected ${args.selector} with: ${args.value}`,
                        },
                    ],
                    isError: false,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to select ${args.selector}: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        case "puppeteer_hover":
            // 悬停在页面上的元素上
            try {
                await page.waitForSelector(args.selector); // 等待选择器对应的元素出现
                await page.hover(args.selector); // 悬停在元素上
                return {
                    content: [
                        {
                            type: "text",
                            text: `Hovered ${args.selector}`,
                        },
                    ],
                    isError: false,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to hover ${args.selector}: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        case "puppeteer_evaluate":
            // 在浏览器控制台中执行 JavaScript 代码
            try {
                await page.evaluate(() => {
                    window.mcpHelper = {
                        logs: [],
                        originalConsole: { ...console },
                    };
                    ["log", "info", "warn", "error"].forEach((method) => {
                        console[method] = (...args) => {
                            window.mcpHelper.logs.push(`[${method}] ${args.join(" ")}`);
                            window.mcpHelper.originalConsole[method](...args);
                        };
                    });
                });
                const result = await page.evaluate(args.script); // 执行 JavaScript 代码
                const logs = await page.evaluate(() => {
                    Object.assign(console, window.mcpHelper.originalConsole);
                    const logs = window.mcpHelper.logs;
                    delete window.mcpHelper;
                    return logs;
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: `Execution result:\n${JSON.stringify(result, null, 2)}\n\nConsole output:\n${logs.join("\n")}`,
                        },
                    ],
                    isError: false,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Script execution failed: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        default:
            return {
                content: [
                    {
                        type: "text",
                        text: `Unknown tool: ${name}`,
                    },
                ],
                isError: true,
            };
    }
}
// 创建 MCP Server 实例
const server = new Server({
    name: "anton-puppeteer", // MCP Server 名称
    version: "0.1.0", // MCP Server 版本
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// 设置请求处理程序
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    // 列出所有可用资源
    resources: [
        {
            uri: "console://logs", // 控制台日志的 URI
            mimeType: "text/plain", // MIME 类型
            name: "Browser console logs", // 资源名称
        },
        ...Array.from(screenshots.keys()).map((name) => ({
            // 屏幕截图的 URI
            uri: `screenshot://${name}`,
            mimeType: "image/png", // MIME 类型
            name: `Screenshot: ${name}`, // 资源名称
        })),
    ],
}));
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    // 读取资源
    const uri = request.params.uri.toString(); // 获取 URI
    if (uri === "console://logs") {
        // 如果是控制台日志
        return {
            contents: [
                {
                    uri,
                    mimeType: "text/plain",
                    text: consoleLogs.join("\n"), // 返回控制台日志
                },
            ],
        };
    }
    if (uri.startsWith("screenshot://")) {
        // 如果是屏幕截图
        const name = uri.split("://")[1]; // 获取截图名称
        const screenshot = screenshots.get(name); // 获取截图
        if (screenshot) {
            return {
                contents: [
                    {
                        uri,
                        mimeType: "image/png",
                        blob: screenshot, // 返回截图
                    },
                ],
            };
        }
    }
    throw new Error(`Resource not found: ${uri}`); // 如果资源未找到，则抛出错误
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    // 列出所有可用工具
    tools: TOOLS,
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => 
// 处理工具调用
handleToolCall(request.params.name, request.params.arguments ?? {}));
/**
 * 运行 MCP Server
 */
async function runServer() {
    const transport = new StdioServerTransport(); // 创建 StdioServerTransport 实例
    await server.connect(transport); // 连接到 transport
}
runServer().catch(console.error); // 运行 server，如果出错则打印错误信息
process.stdin.on("close", () => {
    // 监听 stdin 的 close 事件
    console.error("Puppeteer MCP Server closed");
    server.close(); // 关闭 server
});
