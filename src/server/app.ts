import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { AgentCard } from "../types/agent_card.js";
import { JSONRPCRequest } from "../types/index.js";
import { A2ARequestHandler } from "./request_handler.js";

/**
 * Express application for handling A2A requests
 */
export class A2AApplication {
  private agentCard: AgentCard;
  private requestHandler: A2ARequestHandler;

  /**
   * Create a A2AApplication
   *
   * @param agentCard - Agent card
   * @param requestHandler - Request handler
   */
  constructor(agentCard: AgentCard, requestHandler: A2ARequestHandler) {
    this.agentCard = agentCard;
    this.requestHandler = requestHandler;
  }

  /**
   * Build an Express application
   *
   * @returns Express application
   */
  build(): express.Application {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(bodyParser.json({ limit: "50mb" }));

    // Agent card route
    app.get("/.well-known/agent.json", (_req: Request, res: Response) => {
      res.json(this.agentCard);
    });

    // Main A2A endpoint
    app.post("/", (req: Request, res: Response) => {
      const jsonRpcRequest = req.body as JSONRPCRequest;
      // Store reference to this for use in async functions
      const self = this;

      // Handle different methods
      try {
        switch (jsonRpcRequest.method) {
          case "message/send":
            self.requestHandler
              .onMessageSend(jsonRpcRequest as any)
              .then((messageResponse: any) => {
                res.json(messageResponse);
              })
              .catch((error: any) => {
                handleError(error);
              });
            break;

          case "message/sendStream":
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            // Handle streaming
            (async () => {
              try {
                console.log("Starting SSE stream");
                const sseGenerator = self.requestHandler.onMessageSendStream(
                  jsonRpcRequest as any,
                );

                for await (const chunk of sseGenerator) {
                  if (res.writableEnded) {
                    console.log("Response already ended");
                    break;
                  }

                  console.log("Sending SSE chunk:", JSON.stringify(chunk));
                  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }

                if (!res.writableEnded) {
                  console.log("Sending end event and closing connection");
                  res.write("event: end\ndata: {}\n\n");
                  res.end();
                }
              } catch (error) {
                console.error("Error in SSE stream:", error);
                handleError(error);
              }
            })();
            break;

          case "tasks/get":
            self.requestHandler
              .onGetTask(jsonRpcRequest as any)
              .then((taskResponse: any) => {
                res.json(taskResponse);
              })
              .catch((error: any) => {
                handleError(error);
              });
            break;

          case "tasks/cancel":
            self.requestHandler
              .onCancelTask(jsonRpcRequest as any)
              .then((cancelResponse: any) => {
                res.json(cancelResponse);
              })
              .catch((error: any) => {
                handleError(error);
              });
            break;

          case "tasks/pushNotificationConfig/set":
            self.requestHandler
              .onSetTaskPushNotification(jsonRpcRequest as any)
              .then((setPushResponse: any) => {
                res.json(setPushResponse);
              })
              .catch((error: any) => {
                handleError(error);
              });
            break;

          case "tasks/pushNotificationConfig/get":
            self.requestHandler
              .onGetTaskPushNotification(jsonRpcRequest as any)
              .then((getPushResponse: any) => {
                res.json(getPushResponse);
              })
              .catch((error: any) => {
                handleError(error);
              });
            break;

          case "tasks/resubscribe":
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            // Handle streaming resubscription
            (async () => {
              try {
                const resubscribeGenerator =
                  self.requestHandler.onResubscribeToTask(
                    jsonRpcRequest as any,
                  );

                for await (const chunk of resubscribeGenerator) {
                  if (res.writableEnded) break;
                  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }

                if (!res.writableEnded) {
                  res.write("event: end\ndata: {}\n\n");
                  res.end();
                }
              } catch (error) {
                handleError(error);
              }
            })();
            break;

          default:
            res.status(400).json({
              jsonrpc: "2.0",
              id: jsonRpcRequest.id,
              error: {
                code: -32601,
                message: "Method not found",
              },
            });
        }
      } catch (error) {
        handleError(error);
      }

      // Error handling helper
      function handleError(error: any) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            id: jsonRpcRequest.id,
            error: {
              code: -32603,
              message: `Internal error: ${error}`,
            },
          });
        }
      }
    });

    return app;
  }
}
