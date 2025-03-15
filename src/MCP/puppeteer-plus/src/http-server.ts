import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { PuppeteerHandler } from "./handler.js";

export class HTTPServer {
  private app = express();
  private handler = PuppeteerHandler.getInstance();

  constructor(private port: number = 3000) {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(bodyParser.json());
    this.app.use(cors());
  }

  private setupRoutes() {
    this.app.get("/tools", (req, res) => {
      res.json({ tools: this.handler.TOOLS });
    });

    this.app.post("/call-tool", async (req, res) => {
      try {
        const result = await this.handler.handleToolCall(
          req.body.tool_name,
          req.body.arguments
        );
        res.json({
          tool_call_id: req.body.tool_call_id,
          ...result,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/resources/:type/:name", (req, res) => {
      const { type, name } = req.params;
      const { consoleLogs, screenshots } = this.handler.getResources();

      if (type === "screenshot") {
        const data = screenshots.get(name);
        return data
          ? res.type("png").send(Buffer.from(data, "base64"))
          : res.status(404).send("Screenshot not found");
      }

      if (type === "logs") {
        return res.type("text/plain").send(consoleLogs.join("\n"));
      }

      res.status(404).send("Resource type not supported");
    });
  }

  public start() {
    return this.app.listen(this.port, () => {
      console.log(`HTTP server listening on port ${this.port}`);
    });
  }
}
