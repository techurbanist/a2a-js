import { AgentCard } from "../types/agent_card.js";
import { A2ARequestHandler } from "./request_handler.js";
import { A2AApplication } from "./app.js";

/**
 * Options for starting the server
 */
export interface ServerOptions {
  /**
   * Host to listen on
   */
  host?: string;

  /**
   * Port to listen on
   */
  port?: number;
}

/**
 * A2A Server
 */
export class A2AServer {
  private agentCard: AgentCard;
  private requestHandler: A2ARequestHandler;

  /**
   * Create a new A2AServer
   *
   * @param agentCard - Agent card
   * @param requestHandler - Request handler
   */
  constructor(agentCard: AgentCard, requestHandler: A2ARequestHandler) {
    this.agentCard = agentCard;
    this.requestHandler = requestHandler;
  }

  /**
   * Get the Express application
   *
   * @returns Express application
   */
  app(): any {
    return new A2AApplication(this.agentCard, this.requestHandler).build();
  }

  /**
   * Start the server
   *
   * @param options - Server options
   */
  start(options: ServerOptions = {}): void {
    const host = options.host || "0.0.0.0";
    const port = options.port || 3000;

    const app = this.app();
    const server = app.listen(port, host, () => {
      console.log(`A2A Server running at http://${host}:${port}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("Shutting down A2A server...");
      server.close(() => {
        console.log("A2A server closed");
        process.exit(0);
      });
    });
  }
}
