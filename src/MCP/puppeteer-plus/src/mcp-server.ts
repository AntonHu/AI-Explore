import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PuppeteerHandler } from "./handler.js";
import { appEvents, SystemEvents } from "./events.js";

export class MCPServer {
  private server: Server;
  private handler = PuppeteerHandler.getInstance();

  constructor() {
    this.server = new Server(
      { name: "anton-puppeteer", version: "0.1.0" },
      { capabilities: { resources: {}, tools: {} } }
    );

    this.setupHandlers();
    this.setupNotifications();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.getResourceList(),
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
      const uri = req.params.uri.toString();
      const { consoleLogs, screenshots } = this.handler.getResources();

      if (uri === "console://logs") {
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: consoleLogs.join("\n"),
            },
          ],
        };
      }

      if (uri.startsWith("screenshot://")) {
        const name = uri.split("://")[1];
        const data = screenshots.get(name);
        return data
          ? {
              contents: [
                {
                  uri,
                  mimeType: "image/png",
                  blob: data,
                },
              ],
            }
          : null;
      }

      throw new Error("Resource not found");
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.handler.TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (req) =>
      this.handler.handleToolCall(req.params.name, req.params.arguments ?? {})
    );
  }

  private setupNotifications() {
    appEvents.on(SystemEvents.RESOURCE_UPDATED, (payload) => {
      this.server.notification({
        method: "notifications/resources/updated",
        params: { uri: payload.uri },
      });
    });

    appEvents.on(SystemEvents.LOGS_UPDATED, () => {
      this.server.notification({
        method: "notifications/resources/updated",
        params: { uri: "console://logs" },
      });
    });
  }

  private getResourceList() {
    const { screenshots } = this.handler.getResources();
    return [
      {
        uri: "console://logs",
        mimeType: "text/plain",
        name: "Browser Console Logs",
      },
      ...Array.from(screenshots.keys()).map((name) => ({
        uri: `screenshot://${name}`,
        mimeType: "image/png",
        name: `Screenshot: ${name}`,
      })),
    ];
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP service started via stdio");
  }
}
