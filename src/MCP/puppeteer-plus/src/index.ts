import { MCPServer } from "./mcp-server.js";
import { HTTPServer } from "./http-server.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const mcpServer = new MCPServer();
  const httpServer = new HTTPServer(parseInt(process.env.HTTP_PORT || "3000"));

  await mcpServer.start();
  httpServer.start();
}

main().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
