import {
  A2AError,
  CancelTaskRequest,
  CancelTaskResponse,
  CancelTaskSuccessResponse,
  GetTaskPushNotificationConfigRequest,
  GetTaskPushNotificationConfigResponse,
  GetTaskRequest,
  GetTaskResponse,
  GetTaskSuccessResponse,
  JSONRPCError,
  JSONRPCErrorResponse,
  MessageSendParams,
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingResponse,
  SendMessageStreamingSuccessResponse,
  SendMessageSuccessResponse,
  SetTaskPushNotificationConfigRequest,
  SetTaskPushNotificationConfigResponse,
  Task,
  TaskIdParams,
  TaskNotFoundError,
  TaskQueryParams,
  TaskResubscriptionRequest,
  UnsupportedOperationError,
} from "../types";
import { AgentExecutor } from "./agent_executor";
import { InMemoryTaskStore, TaskStore } from "./task_store";
import { StreamingResponseQueue } from "./streaming_response_queue";

/**
 * Interface for handling A2A requests
 */
export interface A2ARequestHandler {
  /**
   * Handle get task request
   *
   * @param request - Get task request
   * @returns Promise resolving to the get task response
   */
  onGetTask(request: GetTaskRequest): Promise<GetTaskResponse>;

  /**
   * Handle cancel task request
   *
   * @param request - Cancel task request
   * @returns Promise resolving to the cancel task response
   */
  onCancelTask(request: CancelTaskRequest): Promise<CancelTaskResponse>;

  /**
   * Handle message send request
   *
   * @param request - Send message request
   * @returns Promise resolving to the send message response
   */
  onMessageSend(request: SendMessageRequest): Promise<SendMessageResponse>;

  /**
   * Handle message send stream request
   *
   * @param request - Send message streaming request
   * @returns AsyncGenerator yielding streaming responses
   */
  onMessageSendStream(
    request: SendMessageStreamingRequest,
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown>;

  /**
   * Handle set task push notification config request
   *
   * @param request - Set task push notification config request
   * @returns Promise resolving to the set task push notification config response
   */
  onSetTaskPushNotification(
    request: SetTaskPushNotificationConfigRequest,
  ): Promise<SetTaskPushNotificationConfigResponse>;

  /**
   * Handle get task push notification config request
   *
   * @param request - Get task push notification config request
   * @returns Promise resolving to the get task push notification config response
   */
  onGetTaskPushNotification(
    request: GetTaskPushNotificationConfigRequest,
  ): Promise<GetTaskPushNotificationConfigResponse>;

  /**
   * Handle task resubscription request
   *
   * @param request - Task resubscription request
   * @returns AsyncGenerator yielding streaming responses
   */
  onResubscribeToTask(
    request: TaskResubscriptionRequest,
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown>;
}

/**
 * Default implementation of A2ARequestHandler
 */
export class DefaultA2ARequestHandler implements A2ARequestHandler {
  private agentExecutor: AgentExecutor;
  private taskStore: TaskStore;
  private backgroundTasks: Set<Promise<void>> = new Set();

  /**
   * Create a DefaultA2ARequestHandler
   *
   * @param agentExecutor - Agent executor
   * @param taskStore - Task store (optional, defaults to InMemoryTaskStore)
   */
  constructor(agentExecutor: AgentExecutor, taskStore?: TaskStore) {
    this.agentExecutor = agentExecutor;
    this.taskStore = taskStore || new InMemoryTaskStore();
  }

  /**
   * Build an error response
   *
   * @param requestId - Request ID
   * @param error - Error
   * @returns JSON-RPC error response
   */
  private _buildErrorResponse(
    requestId: string | number | null | undefined,
    error: A2AError | JSONRPCError,
  ): JSONRPCErrorResponse {
    return {
      jsonrpc: "2.0",
      id: requestId,
      error: error,
    };
  }

  /**
   * Append a message to a task
   *
   * @param messageSendParams - Message send parameters
   * @param task - Task to append the message to
   */
  private _appendMessageToTask(
    messageSendParams: MessageSendParams,
    task?: Task,
  ): void {
    if (task) {
      task.messages.push(messageSendParams.message);
      task.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Set up a server-sent event consumer
   *
   * @param task - Task (optional)
   * @param request - Send message streaming request
   * @returns AsyncGenerator yielding streaming responses
   */
  private async *_setupSSEConsumer(
    task: Task | undefined,
    request: SendMessageStreamingRequest,
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    const messageSendParams = request.params;

    // Append the message to the task if it exists
    this._appendMessageToTask(messageSendParams, task);

    // Generate streaming responses
    try {
      const responseStream = this.agentExecutor.onMessageStream(request, task);
      for await (const response of responseStream) {
        // Check if the response contains a successful result with a task
        if (
          "result" in response &&
          response.result &&
          typeof response.result === "object" &&
          "taskId" in response.result
        ) {
          // Save the task - cast to unknown first to avoid TypeScript error
          await this.taskStore.save(response.result as unknown as Task);
        }
        yield response;
      }
    } catch (error) {
      console.error("Error in streaming response:", error);
      yield {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error}`,
        },
      };
    }
  }

  /**
   * Handle get task request
   *
   * @param request - Get task request
   * @returns Promise resolving to the get task response
   */
  async onGetTask(request: GetTaskRequest): Promise<GetTaskResponse> {
    const taskQueryParams = request.params;
    const task = await this.taskStore.get(taskQueryParams.id);

    if (!task) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: TaskNotFoundError,
      };
    }

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: task,
    };
  }

  /**
   * Handle cancel task request
   *
   * @param request - Cancel task request
   * @returns Promise resolving to the cancel task response
   */
  async onCancelTask(request: CancelTaskRequest): Promise<CancelTaskResponse> {
    const taskIdParams = request.params;
    const task = await this.taskStore.get(taskIdParams.id);

    if (!task) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: TaskNotFoundError,
      };
    }

    const response = await this.agentExecutor.onCancel(request, task);

    if ("result" in response) {
      await this.taskStore.save(response.result);
    }

    return response;
  }

  /**
   * Handle message send request
   *
   * @param request - Send message request
   * @returns Promise resolving to the send message response
   */
  async onMessageSend(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse> {
    const messageSendParams = request.params;

    let task: Task | undefined;
    if (messageSendParams.message.taskId) {
      task = await this.taskStore.get(messageSendParams.message.taskId);
      this._appendMessageToTask(messageSendParams, task);
    }

    const response = await this.agentExecutor.onMessageSend(request, task);

    if (
      "result" in response &&
      response.result &&
      typeof response.result === "object" &&
      "taskId" in response.result
    ) {
      // Cast to unknown first to avoid TypeScript error when result might be a Task
      await this.taskStore.save(response.result as unknown as Task);
    }

    return response;
  }

  /**
   * Handle message send stream request
   *
   * @param request - Send message streaming request
   * @returns AsyncGenerator yielding streaming responses
   */
  async *onMessageSendStream(
    request: SendMessageStreamingRequest,
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    const messageSendParams = request.params;

    let task: Task | undefined;
    if (messageSendParams.message.taskId) {
      task = await this.taskStore.get(messageSendParams.message.taskId);
    }

    yield* this._setupSSEConsumer(task, request);
  }

  /**
   * Handle set task push notification config request
   *
   * @param request - Set task push notification config request
   * @returns Promise resolving to the set task push notification config response
   */
  async onSetTaskPushNotification(
    request: SetTaskPushNotificationConfigRequest,
  ): Promise<SetTaskPushNotificationConfigResponse> {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: UnsupportedOperationError,
    };
  }

  /**
   * Handle get task push notification config request
   *
   * @param request - Get task push notification config request
   * @returns Promise resolving to the get task push notification config response
   */
  async onGetTaskPushNotification(
    request: GetTaskPushNotificationConfigRequest,
  ): Promise<GetTaskPushNotificationConfigResponse> {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: UnsupportedOperationError,
    };
  }

  /**
   * Handle task resubscription request
   *
   * @param request - Task resubscription request
   * @returns AsyncGenerator yielding streaming responses
   */
  async *onResubscribeToTask(
    request: TaskResubscriptionRequest,
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    const taskIdParams = request.params;
    const task = await this.taskStore.get(taskIdParams.id);

    if (!task) {
      yield {
        jsonrpc: "2.0",
        id: request.id,
        error: TaskNotFoundError,
      };
      return;
    }

    yield* this.agentExecutor.onResubscribe(request, task);
  }
}
