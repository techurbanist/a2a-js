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
  PushNotificationConfig,
  SetTaskPushNotificationConfigResponse,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskQueryParams,
  TaskSendParams,
  Task,
  SendTaskStreamingResponse,
  SetTaskPushNotificationConfigRequest,
  TaskResubscriptionRequest
} from "../types/index.js";

/**
 * Agent Card resolver
 */
export class A2ACardResolver {
  private baseUrl: string;
  private agentCardPath: string;
  private fetchImpl: typeof fetch;

  /**
   * Create a new A2ACardResolver
   *
   * @param baseUrl - Base URL of the agent
   * @param agentCardPath - Path to the agent card JSON
   * @param fetchImpl - Optional custom fetch implementation
   */
  constructor(
    baseUrl: string,
    agentCardPath: string = "/.well-known/agent.json",
    fetchImpl?: typeof fetch
  ) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.agentCardPath = agentCardPath.startsWith("/")
      ? agentCardPath.substring(1)
      : agentCardPath;
    this.fetchImpl = fetchImpl || (globalThis.fetch as typeof fetch);
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available. Provide one explicitly.");
    }
  }

  /**
   * Get the agent card
   *
   * @returns Promise resolving to the AgentCard
   */
  async getAgentCard(): Promise<AgentCard> {
    try {
      const response = await this.fetchImpl(
        `${this.baseUrl}/${this.agentCardPath}`
      );
      if (!response.ok) {
        throw new A2AClientHTTPError(response.status, response.statusText);
      }
      return await response.json() as AgentCard;
    } catch (error) {
      throw new A2AClientJSONError(`Failed to parse agent card: ${error}`);
    }
  }
}

/**
 * A2A Client for communicating with A2A-compatible agents
 */
export class A2AClient {
  private url: string;
  private fetchImpl: typeof fetch;

  /**
   * Create a new A2AClient
   *
   * @param url - URL of the agent
   * @param fetchImpl - Optional custom fetch implementation
   */
  constructor(url: string, fetchImpl?: typeof fetch) {
    this.url = url;
    this.fetchImpl = fetchImpl || (globalThis.fetch as typeof fetch);
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available. Provide one explicitly.");
    }
  }

  /**
   * Send a task to the agent (tasks/send)
   * @param params - TaskSendParams
   * @param requestId - Optional request ID
   * @returns Task | null
   */
  async sendTask(
    params: TaskSendParams,
    requestId: string | number = uuidv4()
  ): Promise<Task | null> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/send",
      params
    };
    const response = await this._sendRequest(request);
    if (response.result && typeof response.result === "object") {
      return response.result as Task;
    }
    return null;
  }

  /**
   * Subscribe to a streaming task (tasks/sendSubscribe)
   * @param params - TaskSendParams
   * @param requestId - Optional request ID
   * @returns Async generator yielding SendTaskStreamingResponse events
   */
  async *sendTaskSubscribe(
    params: TaskSendParams,
    requestId: string | number = uuidv4()
  ): AsyncGenerator<SendTaskStreamingResponse, void, unknown> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/sendSubscribe",
      params
    };
    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      throw new A2AClientHTTPError(response.status, `HTTP error: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new A2AClientHTTPError(500, "Response body is null");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let data = "";
        for (const line of lines) {
          if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }
        if (data) {
          try {
            const parsed = JSON.parse(data);
            yield parsed as SendTaskStreamingResponse;
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Resubscribe to a streaming task (tasks/resubscribe)
   * @param params - TaskQueryParams
   * @param requestId - Optional request ID
   * @returns Async generator yielding SendTaskStreamingResponse events
   */
  async *resubscribeTask(
    params: TaskQueryParams,
    requestId: string | number = uuidv4()
  ): AsyncGenerator<SendTaskStreamingResponse, void, unknown> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/resubscribe",
      params
    };
    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      throw new A2AClientHTTPError(response.status, `HTTP error: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new A2AClientHTTPError(500, "Response body is null");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let data = "";
        for (const line of lines) {
          if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }
        if (data) {
          try {
            const parsed = JSON.parse(data);
            yield parsed as SendTaskStreamingResponse;
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }

  /**
   * Get a task by ID (tasks/get)
   * @param params - TaskQueryParams
   * @param requestId - Optional request ID
   * @returns Task | null
   */
  async getTask(
    params: TaskQueryParams,
    requestId: string | number = uuidv4()
  ): Promise<Task | null> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/get",
      params
    };
    const response = await this._sendRequest(request);
    if (response.result && typeof response.result === "object") {
      return response.result as Task;
    }
    return null;
  }

  /**
   * Cancel a task (tasks/cancel)
   * @param params - TaskIdParams
   * @param requestId - Optional request ID
   * @returns CancelTaskResponse
   */
  async cancelTask(
    params: TaskIdParams,
    requestId: string | number = uuidv4()
  ): Promise<CancelTaskResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/cancel",
      params
    };
    return await this._sendRequest(request) as CancelTaskResponse;
  }

  /**
   * Set task push notification configuration (tasks/pushNotificationConfig/set)
   * @param params - TaskPushNotificationConfig
   * @param requestId - Optional request ID
   * @returns SetTaskPushNotificationConfigResponse
   */
  async setTaskPushNotificationConfig(
    params: TaskPushNotificationConfig,
    requestId: string | number = uuidv4()
  ): Promise<SetTaskPushNotificationConfigResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/pushNotificationConfig/set",
      params
    };
    return await this._sendRequest(request) as SetTaskPushNotificationConfigResponse;
  }

  /**
   * Get task push notification configuration (tasks/pushNotificationConfig/get)
   * @param params - TaskIdParams
   * @param requestId - Optional request ID
   * @returns GetTaskPushNotificationConfigResponse
   */
  async getTaskPushNotificationConfig(
    params: TaskIdParams,
    requestId: string | number = uuidv4()
  ): Promise<GetTaskPushNotificationConfigResponse> {
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tasks/pushNotificationConfig/get",
      params
    };
    return await this._sendRequest(request) as GetTaskPushNotificationConfigResponse;
  }

  /**
   * Send a generic JSON-RPC request
   * @param request - JSON-RPC request object
   * @returns JSON-RPC response object
   */
  private async _sendRequest(request: Record<string, any>): Promise<any> {
    try {
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });
      const data = await response.json();
      if (data.error) {
        throw new A2AClientHTTPError(data.error.code, data.error.message);
      }
      return data;
    } catch (error: any) {
      throw new A2AClientJSONError(`Failed to parse response: ${error}`);
    }
  }
}
