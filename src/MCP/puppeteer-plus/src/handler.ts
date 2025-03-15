import puppeteer, { Browser, Page, ScreenshotOptions } from "puppeteer";
import {
  CallToolResult,
  TextContent,
  ImageContent,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { Mutex } from "async-mutex";
import { appEvents, SystemEvents } from "./events.js";

declare global {
  interface Window {
    mcpHelper: {
      logs: string[];
      originalConsole: Partial<typeof console>;
    };
  }
}

const getErrorMessage = (error: unknown) => {
  return typeof error === "object" && error !== null && "message" in error
    ? error.message
    : `An unexpected error occurred.`;
};

export class PuppeteerHandler {
  private static instance: PuppeteerHandler;
  private browser?: Browser;
  private page?: Page;
  private consoleLogs: string[] = [];
  private screenshots = new Map<string, string>();
  private mutex = new Mutex();
  private consoleInitialized = false;

  public readonly TOOLS: Tool[] = [
    {
      name: "puppeteer_navigate",
      description: "导航到指定的 URL",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
    {
      name: "puppeteer_screenshot",
      description: "截取当前页面或指定元素的屏幕截图",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          selector: { type: "string" },
          width: { type: "number" },
          height: { type: "number" },
        },
        required: ["name"],
      },
    },
    {
      name: "puppeteer_click",
      description: "点击页面上的元素",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string" } },
        required: ["selector"],
      },
    },
    {
      name: "puppeteer_fill",
      description: "填充输入字段",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string" },
          value: { type: "string" },
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
          selector: { type: "string" },
          value: { type: "string" },
        },
        required: ["selector", "value"],
      },
    },
    {
      name: "puppeteer_hover",
      description: "悬停在页面上的元素上",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string" } },
        required: ["selector"],
      },
    },
    {
      name: "puppeteer_evaluate",
      description: "在浏览器控制台中执行 JavaScript 代码",
      inputSchema: {
        type: "object",
        properties: { script: { type: "string" } },
        required: ["script"],
      },
    },
  ];

  private constructor() {}

  public static getInstance(): PuppeteerHandler {
    if (!PuppeteerHandler.instance) {
      PuppeteerHandler.instance = new PuppeteerHandler();
    }
    return PuppeteerHandler.instance;
  }

  public async handleToolCall(
    name: string,
    args: any
  ): Promise<CallToolResult> {
    const release = await this.mutex.acquire();
    try {
      const page = await this.ensureBrowser();
      if (!this.consoleInitialized) {
        await this.setupConsoleMonitoring(page);
      }

      switch (name) {
        case "puppeteer_navigate":
          return this.handleNavigate(page, args);
        case "puppeteer_screenshot":
          return this.handleScreenshot(page, args);
        case "puppeteer_click":
          return this.handleClick(page, args);
        case "puppeteer_fill":
          return this.handleFill(page, args);
        case "puppeteer_select":
          return this.handleSelect(page, args);
        case "puppeteer_hover":
          return this.handleHover(page, args);
        case "puppeteer_evaluate":
          return this.handleEvaluate(page, args);
        default:
          return this.createErrorResult(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`${message}`);
    } finally {
      release();
    }
  }

  private async ensureBrowser(): Promise<Page> {
    if (!this.browser) {
      const launchOptions = process.env.DOCKER_CONTAINER
        ? {
            headless: true,
            args: ["--no-sandbox", "--single-process", "--no-zygote"],
          }
        : { headless: false };

      this.browser = await puppeteer.launch(launchOptions);
      const pages = await this.browser.pages();
      this.page = pages[0];

      this.page.on("console", (msg) => {
        const logEntry = `[CONSOLE ${msg.type()}] ${msg.text()}`;
        this.consoleLogs.push(logEntry);
        appEvents.emit(SystemEvents.LOGS_UPDATED);
      });
    }
    return this.page!;
  }

  private async setupConsoleMonitoring(page: Page) {
    await page.evaluate(() => {
      window.mcpHelper = {
        logs: [],
        originalConsole: { ...console },
      };

      ["log", "info", "warn", "error"].forEach((method) => {
        (console as any)[method] = (...args: any[]) => {
          const logEntry = args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
            .join(" ");
          window.mcpHelper.logs.push(`[${method.toUpperCase()}] ${logEntry}`);
          (window.mcpHelper.originalConsole as any)[method](...args);
        };
      });
    });

    setInterval(async () => {
      const logs = await page.evaluate(() => {
        const logs = window.mcpHelper.logs;
        window.mcpHelper.logs = [];
        return logs;
      });

      if (logs.length > 0) {
        this.consoleLogs.push(...logs);
        appEvents.emit(SystemEvents.LOGS_UPDATED);
      }
    }, 5000);

    this.consoleInitialized = true;
  }

  private async handleNavigate(page: Page, args: any): Promise<CallToolResult> {
    await page.goto(args.url);
    return {
      content: [{ type: "text", text: `Navigated to ${args.url}` }],
      isError: false,
    };
  }

  private async handleScreenshot(
    page: Page,
    args: any
  ): Promise<CallToolResult> {
    const { name, selector, width = 800, height = 600 } = args;

    try {
      await page.setViewport({ width, height });
      const element = selector ? await page.$(selector) : null;

      if (selector && !element) {
        return this.createErrorResult(`Element not found: ${selector}`);
      }

      const screenshot = await (element || page).screenshot({
        encoding: "base64",
        ...(!element && { fullPage: false }),
      });

      const filePath = this.saveScreenshot(name, screenshot as string);
      this.screenshots.set(name, screenshot as string);
      appEvents.emit(SystemEvents.RESOURCE_UPDATED, {
        uri: `screenshot://${name}`,
      });

      return {
        content: [
          { type: "text", text: `Screenshot saved: ${filePath}` },
          { type: "image", data: screenshot, mimeType: "image/png" },
        ],
        isError: false,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Screenshot failed: ${message}`);
    }
  }

  private saveScreenshot(name: string, data: string): string {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dir = path.join(__dirname, "screenshots");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${name}-${Date.now()}.png`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
    return filePath;
  }

  private async handleClick(page: Page, args: any): Promise<CallToolResult> {
    try {
      await page.click(args.selector);
      return {
        content: [{ type: "text", text: `Clicked: ${args.selector}` }],
        isError: false,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Click failed: ${message}`);
    }
  }

  private async handleFill(page: Page, args: any): Promise<CallToolResult> {
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
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Fill failed: ${message}`);
    }
  }

  private async handleSelect(page: Page, args: any): Promise<CallToolResult> {
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
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Select failed: ${message}`);
    }
  }

  private async handleHover(page: Page, args: any): Promise<CallToolResult> {
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
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Hover failed: ${message}`);
    }
  }

  private async handleEvaluate(page: Page, args: any): Promise<CallToolResult> {
    try {
      const result = await page.evaluate(args.script);
      const logs = await page.evaluate(() => {
        const logs = window.mcpHelper.logs;
        window.mcpHelper.logs = [];
        return logs;
      });

      this.consoleLogs.push(...logs);
      appEvents.emit(SystemEvents.LOGS_UPDATED);

      return {
        content: [
          {
            type: "text",
            text: `Result: ${JSON.stringify(
              result,
              null,
              2
            )}\nLogs:\n${logs.join("\n")}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      return this.createErrorResult(`Evaluation failed: ${message}`);
    }
  }

  private createErrorResult(message: string): CallToolResult {
    return {
      content: [{ type: "text", text: message }],
      isError: true,
    };
  }

  public getResources() {
    return {
      consoleLogs: [...this.consoleLogs],
      screenshots: new Map(this.screenshots),
    };
  }
}
