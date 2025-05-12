import axios, { AxiosInstance } from "axios";
import { v4 as uuidv4 } from "uuid";

import {
  A2AClientHTTPError,
  A2AClientJSONError
} from "./errors.js";

import { AgentCard } from "../types/agent_card.js";
import {
  CancelTaskResponse,
  GetTaskPushNotificationConfigResponse,
  GetTaskResponse,
  MessageSendParams,
  PushNotificationConfig,
  SendMessageResponse,
  SendMessageStreamingResponse,
  SetTaskPushNotificationConfigResponse,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskQueryParams,
} from "../types/index.js";



/**
 * Agent Card resolver
 */
export class A2ACardResolver {
  private baseUrl: string;
  private agentCardPath: string;
  private axiosClient: AxiosInstance;

  /**
   * Create a new A2ACardResolver
   *
   * @param axiosClient - Axios client instance
   * @param baseUrl - Base URL of the agent
   * @param agentCardPath - Path to the agent card JSON
   */
  constructor(
    axiosClient: AxiosInstance,
    baseUrl: string,
    agentCardPath: string = "/.well-known/agent.json",
  ) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.agentCardPath = agentCardPath.startsWith("/")
      ? agentCardPath.substring(1)
      : agentCardPath;
    this.axiosClient = axiosClient;
  }

  /**
   * Get the agent card
   *
   * @returns Promise resolving to the AgentCard
   */
  async getAgentCard(): Promise<AgentCard> {
    try {
      const response = await this.axiosClient.get(
        `${this.baseUrl}/${this.agentCardPath}`,
      );
      return response.data as AgentCard;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new A2AClientHTTPError(error.response.status, error.message);
        } else if (error.request) {
          throw new A2AClientHTTPError(
            503,
            `Network communication error: ${error.message}`,
          );
        }
      }
      throw new A2AClientJSONError(`Failed to parse agent card: ${error}`);
    }
  }
}

/**
 * A2A Client for communicating with A2A-compatible agents
 */
export class A2AClient {
  private url: string;
  private axiosClient: AxiosInstance;

  /**
   * Create a new A2AClient
   *
   * @param axiosClient - Axios client instance
   * @param agentCard - Agent card (optional if url is provided)
   * @param url - URL of the agent (optional if agentCard is provided)
   */
  constructor(axiosClient: AxiosInstance, agentCard?: AgentCard, url?: string) {
    if (agentCard) {
      this.url = agentCard.url;
    } else if (url) {
      this.url = url;
    } else {
      throw new Error("Must provide either agentCard or url");
    }

    this.axiosClient = axiosClient;
  }

  /**
   * Get a client from an agent card URL
   *
   * @param axiosClient - Axios client instance
   * @param baseUrl - Base URL of the agent
   * @param agentCardPath - Path to the agent card JSON
   * @returns Promise resolving to the A2AClient
   */
  static async getClientFromAgentCardUrl(
    axiosClient: AxiosInstance,
    baseUrl: string,
    agentCardPath: string = "/.well-known/agent.json",
  ): Promise<A2AClient> {
    const cardResolver = new A2ACardResolver(
      axiosClient,
      baseUrl,
      agentCardPath,
    );
    const agentCard = await cardResolver.getAgentCard();
    return new A2AClient(axiosClient, agentCard);
  }

  /**
   * Send a message to the agent
   *
   * @param payload - Message payload
   * @param requestId - Request ID (defaults to a UUID)
   * @returns Promise resolving to the SendMessageResponse
   */
  async sendMessage(
    payload: Record<string, any>,
    requestId: string | number = uuidv4(),
  ): Promise<SendMessageResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "message/send",
      params: payload as MessageSendParams,
    };

    return (await this._sendRequest(request)) as SendMessageResponse;
  }

  /**
   * Send a message to the agent with streaming response
   *
   * @param payload - Message payload
   * @param requestId - Request ID (defaults to a UUID)
   * @param onChunk - Callback function for each chunk
   * @returns Promise that resolves when the stream ends
   */
  async sendMessageStreaming(
    payload: Record<string, any>,
    requestId: string | number = uuidv4(),
    onChunk: (response: SendMessageStreamingResponse) => void,
  ): Promise<void> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "message/sendStream",
      params: payload as MessageSendParams,
    };

    try {
      // For Node.js, use a more direct approach with fetch API
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new A2AClientHTTPError(
          response.status,
          `HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      // Check if we have a ReadableStream
      if (!response.body) {
        throw new A2AClientHTTPError(500, "Response body is null");
      }

      // Using regular fetch + reader pattern which works on both Node.js and browsers
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE messages
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const message of messages) {
          if (!message.trim()) continue;

          // Process each message
          const lines = message.split("\n");
          let data = "";
          let eventType = "message";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            } else if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            }
          }

          if (eventType === "end") {
            return; // End of stream
          }

          if (data) {
            try {
              const parsedData = JSON.parse(data);
              onChunk(parsedData as SendMessageStreamingResponse);
            } catch (error) {
              console.error("Failed to parse SSE data:", error);
            }
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new A2AClientHTTPError(error.response.status, error.message);
        } else if (error.request) {
          throw new A2AClientHTTPError(
            503,
            `Network communication error: ${error.message}`,
          );
        }
      }
      throw new A2AClientJSONError(
        `Failed to process streaming response: ${error}`,
      );
    }
  }

  /**
   * Send a generic request to the agent
   *
   * @param request - Request object
   * @returns Promise resolving to the response
   */
  private async _sendRequest(
    request: Record<string, any>,
  ): Promise<Record<string, any>> {
    try {
      const response = await this.axiosClient.post(this.url, request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new A2AClientHTTPError(error.response.status, error.message);
        } else if (error.request) {
          throw new A2AClientHTTPError(
            503,
            `Network communication error: ${error.message}`,
          );
        }
      }
      throw new A2AClientJSONError(`Failed to parse response: ${error}`);
    }
  }

  /**
   * Get a task by ID
   *
   * @param payload - Task query payload
   * @param requestId - Request ID (defaults to a UUID)
   * @returns Promise resolving to the GetTaskResponse
   */
  async getTask(
    payload: Record<string, any>,
    requestId: string | number = uuidv4(),
  ): Promise<GetTaskResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/get",
      params: payload as TaskQueryParams,
    };

    return (await this._sendRequest(request)) as GetTaskResponse;
  }

  /**
   * Cancel a task
   *
   * @param payload - Task ID payload
   * @param requestId - Request ID (defaults to a UUID)
   * @returns Promise resolving to the CancelTaskResponse
   */
  async cancelTask(
    payload: Record<string, any>,
    requestId: string | number = uuidv4(),
  ): Promise<CancelTaskResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/cancel",
      params: payload as TaskIdParams,
    };

    return (await this._sendRequest(request)) as CancelTaskResponse;
  }

  /**
   * Set task push notification configuration
   *
   * @param taskId - Task ID
   * @param pushConfig - Push notification configuration
   * @param metadata - Optional metadata
   * @param requestId - Request ID (defaults to a UUID)
   * @returns Promise resolving to the SetTaskPushNotificationConfigResponse
   */
  async setTaskCallback(
    taskId: string,
    pushConfig: PushNotificationConfig | null,
    metadata?: Record<string, any> | null,
    requestId: string | number = uuidv4(),
  ): Promise<SetTaskPushNotificationConfigResponse> {
    const params: TaskPushNotificationConfig = {
      id: taskId,
      pushNotificationConfig: pushConfig,
      metadata: metadata
    };
    
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/pushNotificationConfig/set",
      params,
    };

    return (await this._sendRequest(
      request,
    )) as SetTaskPushNotificationConfigResponse;
  }

  /**
   * Get task push notification configuration
   *
   * @param taskId - Task ID
   * @param metadata - Optional metadata
   * @param requestId - Request ID (defaults to a UUID)
   * @returns Promise resolving to the GetTaskPushNotificationConfigResponse
   */
  async getTaskCallback(
    taskId: string,
    metadata?: Record<string, any> | null,
    requestId: string | number = uuidv4(),
  ): Promise<GetTaskPushNotificationConfigResponse> {
    const params: TaskIdParams = {
      id: taskId,
      metadata
    };
    
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/pushNotificationConfig/get",
      params,
    };

    return (await this._sendRequest(
      request,
    )) as GetTaskPushNotificationConfigResponse;
  }
}
