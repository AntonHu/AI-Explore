#!/usr/bin/env node

/**
 * @file puppeteer.ts
 * @description 这是一个使用 Puppeteer 库控制 Chromium 浏览器的 MCP (Model Context Protocol) 服务器。
 * 它允许通过 MCP 协议接收指令，并使用 Puppeteer 执行诸如导航、截图、点击、填写表单等操作。
 * 此服务器旨在提供一个可编程的浏览器接口，用于自动化 Web 任务和数据抓取。
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"; // 导入 MCP 服务器类
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; // 导入 MCP 标准输入输出传输类
import {
  CallToolRequestSchema, // 导入调用工具请求的 Schema
  ListResourcesRequestSchema, // 导入列出资源请求的 Schema
  ListToolsRequestSchema, // 导入列出工具请求的 Schema
  ReadResourceRequestSchema, // 导入读取资源请求的 Schema
  CallToolResult, // 导入调用工具结果的类型
  TextContent, // 导入文本内容的类型
  ImageContent, // 导入图像内容的类型
  Tool, // 导入工具的类型
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer, { Browser, Page } from "puppeteer"; // 导入 Puppeteer 库，用于控制 Chromium 浏览器

// 定义工具列表，避免重复定义
const TOOLS: Tool[] = [
  {
    name: "puppeteer_navigate", // 工具名称：导航
    description: "Navigate to a URL", // 工具描述：导航到指定的 URL
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        url: { type: "string" }, // URL 参数，字符串类型
      },
      required: ["url"], // 必需参数：URL
    },
  },
  {
    name: "puppeteer_screenshot", // 工具名称：截图
    description: "Take a screenshot of the current page or a specific element", // 工具描述：截取当前页面或指定元素的截图
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the screenshot" }, // 截图名称参数，字符串类型
        selector: {
          // CSS 选择器参数，字符串类型
          type: "string",
          description: "CSS selector for element to screenshot", // 描述：用于截图的 CSS 选择器
        },
        width: {
          // 宽度参数，数字类型
          type: "number",
          description: "Width in pixels (default: 800)", // 描述：截图宽度，像素单位（默认 800）
        },
        height: {
          // 高度参数，数字类型
          type: "number",
          description: "Height in pixels (default: 600)", // 描述：截图高度，像素单位（默认 600）
        },
      },
      required: ["name"], // 必需参数：name
    },
  },
  {
    name: "puppeteer_click", // 工具名称：点击
    description: "Click an element on the page", // 工具描述：点击页面上的元素
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        selector: {
          // CSS 选择器参数，字符串类型
          type: "string",
          description: "CSS selector for element to click", // 描述：用于点击的 CSS 选择器
        },
      },
      required: ["selector"], // 必需参数：selector
    },
  },
  {
    name: "puppeteer_fill", // 工具名称：填写
    description: "Fill out an input field", // 工具描述：填写输入框
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        selector: {
          // CSS 选择器参数，字符串类型
          type: "string",
          description: "CSS selector for input field", // 描述：用于定位输入框的 CSS 选择器
        },
        value: { type: "string", description: "Value to fill" }, // 填写的值参数，字符串类型
      },
      required: ["selector", "value"], // 必需参数：selector, value
    },
  },
  {
    name: "puppeteer_select", // 工具名称：选择
    description: "Select an element on the page with Select tag", // 工具描述：使用 Select 标签选择页面上的元素
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        selector: {
          // CSS 选择器参数，字符串类型
          type: "string",
          description: "CSS selector for element to select", // 描述：用于定位 Select 标签的 CSS 选择器
        },
        value: { type: "string", description: "Value to select" }, // 选择的值参数，字符串类型
      },
      required: ["selector", "value"], // 必需参数：selector, value
    },
  },
  {
    name: "puppeteer_hover", // 工具名称：悬停
    description: "Hover an element on the page", // 工具描述：悬停在页面上的元素上
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        selector: {
          // CSS 选择器参数，字符串类型
          type: "string",
          description: "CSS selector for element to hover", // 描述：用于定位悬停元素的 CSS 选择器
        },
      },
      required: ["selector"], // 必需参数：selector
    },
  },
  {
    name: "puppeteer_evaluate", // 工具名称：执行 JavaScript
    description: "Execute JavaScript in the browser console", // 工具描述：在浏览器控制台中执行 JavaScript 代码
    inputSchema: {
      // 输入参数 Schema
      type: "object",
      properties: {
        script: { type: "string", description: "JavaScript code to execute" }, // JavaScript 代码参数，字符串类型
      },
      required: ["script"], // 必需参数：script
    },
  },
];

// 全局状态
let browser: Browser | undefined; // Puppeteer 浏览器实例
let page: Page | undefined; // Puppeteer 页面实例
const consoleLogs: string[] = []; // 控制台日志记录
const screenshots = new Map<string, string>(); // 截图存储，键为截图名称，值为 base64 编码的图像数据

/**
 * 确保浏览器实例存在，如果不存在则创建新的浏览器实例和页面实例。
 * @returns {Promise<Page>} 返回 Puppeteer 页面实例。
 */
async function ensureBrowser() {
  if (!browser) {
    // 如果浏览器实例不存在
    const npx_args = { headless: false }; // npx 启动参数，显示浏览器界面
    const docker_args = {
      // Docker 启动参数，无头模式，适用于 Docker 环境
      headless: true,
      args: ["--no-sandbox", "--single-process", "--no-zygote"],
    };
    browser = await puppeteer.launch(
      // 启动浏览器
      process.env.DOCKER_CONTAINER ? docker_args : npx_args // 根据环境变量选择启动参数
    );
    const pages = await browser.pages(); // 获取所有页面
    page = pages[0]; // 获取第一个页面

    page.on("console", (msg) => {
      // 监听控制台消息
      const logEntry = `[${msg.type()}] ${msg.text()}`; // 格式化日志
      consoleLogs.push(logEntry); // 添加到日志记录
      server.notification({
        // 发送通知，更新控制台日志资源
        method: "notifications/resources/updated",
        params: { uri: "console://logs" },
      });
    });
  }
  return page!; // 返回页面实例
}

declare global {
  interface Window {
    mcpHelper: {
      logs: string[];
      originalConsole: Partial<typeof console>;
    };
  }
}

/**
 * 处理工具调用请求，根据工具名称执行相应的 Puppeteer 操作。
 * @param {string} name 工具名称
 * @param {any} args 工具参数
 * @returns {Promise<CallToolResult>} 返回工具调用结果
 */
async function handleToolCall(
  name: string, // 工具名称
  args: any // 工具参数
): Promise<CallToolResult> {
  const page = await ensureBrowser(); // 确保浏览器实例存在

  switch (
    name // 根据工具名称执行不同的操作
  ) {
    case "puppeteer_navigate": // 导航工具
      await page.goto(args.url); // 导航到指定 URL
      return {
        content: [
          {
            type: "text",
            text: `Navigated to ${args.url}`, // 返回导航成功的消息
          },
        ],
        isError: false,
      };

    case "puppeteer_screenshot": {
      // 截图工具
      const width = args.width ?? 800; // 获取宽度参数，默认为 800
      const height = args.height ?? 600; // 获取高度参数，默认为 600
      await page.setViewport({ width, height }); // 设置视口大小

      const screenshot = await (args.selector // 截取指定元素或整个页面
        ? (await page.$(args.selector))?.screenshot({ encoding: "base64" })
        : page.screenshot({ encoding: "base64", fullPage: false }));

      if (!screenshot) {
        // 如果截图失败
        return {
          content: [
            {
              type: "text",
              text: args.selector
                ? `Element not found: ${args.selector}` // 如果指定元素未找到
                : "Screenshot failed", // 如果截图失败
            },
          ],
          isError: true,
        };
      }

      screenshots.set(args.name, screenshot as string); // 存储截图
      server.notification({
        // 发送通知，更新截图资源列表
        method: "notifications/resources/list_changed",
      });

      return {
        content: [
          {
            type: "text",
            text: `Screenshot '${args.name}' taken at ${width}x${height}`, // 返回截图成功的消息
          } as TextContent,
          {
            type: "image",
            data: screenshot, // 截图数据
            mimeType: "image/png", // MIME 类型
          } as ImageContent,
        ],
        isError: false,
      };
    }

    case "puppeteer_click": // 点击工具
      try {
        await page.click(args.selector); // 点击指定元素
        return {
          content: [
            {
              type: "text",
              text: `Clicked: ${args.selector}`, // 返回点击成功的消息
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 如果点击失败
        return {
          content: [
            {
              type: "text",
              text: `Failed to click ${args.selector}: ${
                (error as Error).message // 返回点击失败的消息
              }`,
            },
          ],
          isError: true,
        };
      }

    case "puppeteer_fill": // 填写工具
      try {
        await page.waitForSelector(args.selector); // 等待元素出现
        await page.type(args.selector, args.value); // 填写输入框
        return {
          content: [
            {
              type: "text",
              text: `Filled ${args.selector} with: ${args.value}`, // 返回填写成功的消息
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 如果填写失败
        return {
          content: [
            {
              type: "text",
              text: `Failed to fill ${args.selector}: ${
                (error as Error).message // 返回填写失败的消息
              }`,
            },
          ],
          isError: true,
        };
      }

    case "puppeteer_select": // 选择工具
      try {
        await page.waitForSelector(args.selector); // 等待元素出现
        await page.select(args.selector, args.value); // 选择下拉框选项
        return {
          content: [
            {
              type: "text",
              text: `Selected ${args.selector} with: ${args.value}`, // 返回选择成功的消息
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 如果选择失败
        return {
          content: [
            {
              type: "text",
              text: `Failed to select ${args.selector}: ${
                (error as Error).message // 返回选择失败的消息
              }`,
            },
          ],
          isError: true,
        };
      }

    case "puppeteer_hover": // 悬停工具
      try {
        await page.waitForSelector(args.selector); // 等待元素出现
        await page.hover(args.selector); // 悬停在元素上
        return {
          content: [
            {
              type: "text",
              text: `Hovered ${args.selector}`, // 返回悬停成功的消息
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 如果悬停失败
        return {
          content: [
            {
              type: "text",
              text: `Failed to hover ${args.selector}: ${
                (error as Error).message // 返回悬停失败的消息
              }`,
            },
          ],
          isError: true,
        };
      }

    case "puppeteer_evaluate": // 执行 JavaScript 工具
      try {
        await page.evaluate(() => {
          // 在页面中执行 JavaScript 代码
          window.mcpHelper = {
            // 创建 mcpHelper 对象，用于存储日志和原始 console 对象
            logs: [],
            originalConsole: { ...console },
          };

          ["log", "info", "warn", "error"].forEach((method) => {
            // 覆盖 console 方法，记录日志
            (console as any)[method] = (...args: any[]) => {
              window.mcpHelper.logs.push(`[${method}] ${args.join(" ")}`); // 记录日志
              (window.mcpHelper.originalConsole as any)[method](...args); // 调用原始 console 方法
            };
          });
        });

        const result = await page.evaluate(args.script); // 执行 JavaScript 代码

        const logs = await page.evaluate(() => {
          // 获取日志
          Object.assign(console, window.mcpHelper.originalConsole); // 恢复原始 console 对象
          const logs = window.mcpHelper.logs; // 获取日志
          delete (window as any).mcpHelper; // 删除 mcpHelper 对象
          return logs;
        });

        return {
          content: [
            {
              type: "text",
              text: `Execution result:\n${JSON.stringify(
                result,
                null,
                2
              )}\n\nConsole output:\n${logs.join("\n")}`, // 返回执行结果和控制台输出
            },
          ],
          isError: false,
        };
      } catch (error) {
        // 如果执行失败
        return {
          content: [
            {
              type: "text",
              text: `Script execution failed: ${(error as Error).message}`, // 返回执行失败的消息
            },
          ],
          isError: true,
        };
      }

    default: // 未知工具
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`, // 返回未知工具的消息
          },
        ],
        isError: true,
      };
  }
}

const server = new Server( // 创建 MCP 服务器实例
  {
    name: "example-servers/puppeteer", // 服务器名称
    version: "0.1.0", // 服务器版本
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// 设置请求处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  // 处理列出资源请求
  resources: [
    {
      uri: "console://logs", // 控制台日志资源 URI
      mimeType: "text/plain", // MIME 类型
      name: "Browser console logs", // 资源名称
    },
    ...Array.from(screenshots.keys()).map((name) => ({
      // 截图资源
      uri: `screenshot://${name}`, // 截图资源 URI
      mimeType: "image/png", // MIME 类型
      name: `Screenshot: ${name}`, // 资源名称
    })),
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  // 处理读取资源请求
  const uri = request.params.uri.toString(); // 获取资源 URI

  if (uri === "console://logs") {
    // 如果请求的是控制台日志资源
    return {
      contents: [
        {
          uri, // 资源 URI
          mimeType: "text/plain", // MIME 类型
          text: consoleLogs.join("\n"), // 控制台日志内容
        },
      ],
    };
  }

  if (uri.startsWith("screenshot://")) {
    // 如果请求的是截图资源
    const name = uri.split("://")[1]; // 获取截图名称
    const screenshot = screenshots.get(name); // 获取截图数据
    if (screenshot) {
      // 如果截图存在
      return {
        contents: [
          {
            uri, // 资源 URI
            mimeType: "image/png", // MIME 类型
            blob: screenshot, // 截图数据
          },
        ],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`); // 资源未找到
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  // 处理列出工具请求
  tools: TOOLS, // 返回工具列表
}));

server.setRequestHandler(
  CallToolRequestSchema,
  async (
    request // 处理调用工具请求
  ) => handleToolCall(request.params.name, request.params.arguments ?? {}) // 调用工具处理函数
);

/**
 * 运行服务器
 */
async function runServer() {
  const transport = new StdioServerTransport(); // 创建标准输入输出传输实例
  await server.connect(transport); // 连接服务器
}

runServer().catch(console.error); // 启动服务器，并捕获错误

process.stdin.on("close", () => {
  // 监听进程关闭事件
  console.error("Puppeteer MCP Server closed"); // 打印错误信息
  server.close(); // 关闭服务器
});
