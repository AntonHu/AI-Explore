#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from "puppeteer";
import axios from "axios";

class PuppeteerServer {
  private server: Server;
  private browser!: puppeteer.Browser;

  constructor() {
    this.server = new Server(
      {
        name: "puppeteer-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {
            navigate: this.navigate,
            screenshot: this.screenshot,
            click: this.click,
            hover: this.hover,
            fill: this.fill,
            select: this.select,
            evaluate: this.evaluate,
          },
        },
      }
    );
  }

  async navigate(url: string) {
    const page = await this.browser.newPage();
    await page.goto(url);
    return { content: ["Navigation to " + url] };
  }

  async screenshot({
    name,
    selector,
    width,
    height,
  }: {
    name: string;
    selector?: string;
    width?: number;
    height?: number;
  }) {
    const page = await this.browser.newPage();
    if (selector) {
      const element = await page.$(selector);
      await element?.screenshot({
        path: `screenshots/${name}.png`,
        width,
        height,
      });
    } else {
      await page.screenshot({
        path: `screenshots/${name}.png`,
        fullPage: true,
        width,
        height,
      });
    }
    return { content: ["Screenshot saved as " + name] };
  }

  async click(selector: string) {
    const page = await this.browser.newPage();
    await page.click(selector);
    return { content: ["Clicked element with selector " + selector] };
  }

  async hover(selector: string) {
    const page = await this.browser.newPage();
    await page.hover(selector);
    return { content: ["Hovered over element with selector " + selector] };
  }

  async fill({ selector, value }: { selector: string; value: string }) {
    const page = await this.browser.newPage();
    await page.fill(selector, value);
    return {
      content: [
        "Filled input with selector " + selector + " with value " + value,
      ],
    };
  }

  async select({ selector, value }: { selector: string; value: string }) {
    const page = await this.browser.newPage();
    await page.select(selector, value);
    return {
      content: [
        "Selected option from element with selector " +
          selector +
          " with value " +
          value,
      ],
    };
  }

  async evaluate(script: string) {
    const page = await this.browser.newPage();
    const result = await page.evaluate(eval, script);
    return {
      content: ["Evaluated JavaScript: " + script + " Result: " + result],
    };
  }

  async run() {
    this.browser = await puppeteer.launch({ headless: true });
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Puppeteer server running on stdio");
  }
}

const server = new PuppeteerServer();
server.run().catch(console.error);
