/**
 * Type definitions for the A2A Protocol RPC Methods
 */

/**
 * Any JSON-RPC message conforming to JSON-RPC 2.0 spec
 */
export interface JSONRPCMessage {
  /**
   * Specifies the version of the JSON-RPC protocol. MUST be exactly "2.0".
   */
  jsonrpc: "2.0";

  /**
   * An identifier established by the Client that MUST contain a String or Number
   * Numbers SHOULD NOT contain fractional parts
   */
  id?: string | number | null;
}

/**
 * JSON-RPC request object
 */
export interface JSONRPCRequest extends JSONRPCMessage {
  /**
   * A String containing the name of the method to be invoked.
   */
  method: string;

  /**
   * A Structured value that holds the parameter values to be used during the invocation of the method.
   */
  params?: Record<string, any> | null;
}

/**
 * JSON-RPC successful response object
 */
export interface JSONRPCResult extends JSONRPCMessage {
  /**
   * The result object on success
   */
  result: any;
}

/**
 * Push notification configuration for receiving task updates
 * Based on Section 6.8 of the A2A Protocol Specification
 */
export interface PushNotificationConfig {
  /**
   * Absolute HTTPS webhook URL for the A2A Server to POST task updates to
   */
  url: string;
  
  /**
   * Optional client-generated opaque token for the client's webhook receiver to validate the notification
   */
  token?: string | null;
  
  /**
   * Optional authentication details the A2A Server needs when calling the client's webhook
   */
  authentication?: {
    /**
     * Authentication schemes the caller must use (e.g., "Bearer", "ApiKey", "Basic")
     */
    schemes: string[];
    
    /**
     * Optional field for providing credentials or scheme-specific information
     */
    credentials?: string | null;
  } | null;
}

/**
 * Parameters for sending a task
 */
export interface TaskSendParams {
  /**
   * The ID for the task. If this is the first message for a new task, the client generates this ID.
   * If this message continues an existing task (e.g., providing more input after an `input-required` state),
   * this ID MUST match the ID of the existing task.
   */
  id: string;

  /**
   * Optional client-generated session ID to group this task with others.
   */
  sessionId?: string | null;

  /**
   * The message to send to the agent. The `role` within this message is typically "user".
   */
  message: Message;

  /**
   * Optional: If initiating a new task, the client MAY include push notification configuration.
   * If provided for an existing task, server behavior (e.g., update config, ignore) is server-dependent.
   * Requires `AgentCard.capabilities.pushNotifications: true`.
   */
  pushNotification?: PushNotificationConfig | null;

  /**
   * Optional: If a positive integer `N` is provided, the server SHOULD include the last `N` messages
   * (chronologically) of the task's history in the `Task.history` field of the response.
   * If `0`, `null`, or omitted, no history is explicitly requested (server MAY still include some by default).
   */
  historyLength?: number | null;

  /**
   * Arbitrary metadata for this specific `tasks/send` request.
   */
  metadata?: Record<string, any> | null;
}

/**
 * Task query parameters for retrieving a task's current state
 */
export interface TaskQueryParams {
  /**
   * The ID of the task to retrieve.
   */
  id: string;
  
  /**
   * Optional: If a positive integer `N` is provided, the server SHOULD include the last `N` messages
   * (chronologically) of the task's history in the `Task.history` field of the response.
   * If `0`, `null`, or omitted, no history is explicitly requested.
   */
  historyLength?: number | null;
  
  /**
   * Arbitrary metadata for this specific `tasks/get` request.
   */
  metadata?: Record<string, any> | null;
}

/**
 * Task ID parameters for operations that only need a task ID
 */
export interface TaskIdParams {
  /**
   * The ID of the task.
   */
  id: string;
  
  /**
   * Arbitrary metadata for this specific request.
   */
  metadata?: Record<string, any> | null;
}

/**
 * Parameters for sending a message
 */
export interface MessageSendParams {
  /**
   * The message to send
   */
  message: Message;
}

/**
 * Push notification configuration for a task
 * Based on Section 6.10 of the A2A Protocol Specification
 */
export interface TaskPushNotificationConfig {
  /**
   * The ID of the task for which push notification settings are being configured or retrieved
   */
  id: string;

  /**
   * The push notification configuration details
   */
  pushNotificationConfig: PushNotificationConfig | null;
  
  /**
   * Arbitrary metadata for this specific request
   */
  metadata?: Record<string, any> | null;
}

/**
 * Request to send a message
 */
export interface SendMessageRequest extends JSONRPCRequest {
  /**
   * Fixed method for sending messages
   */
  method: "message/send";

  /**
   * Message parameters
   */
  params: MessageSendParams;
}

/**
 * Success response for send message
 */
export interface SendMessageSuccessResponse extends JSONRPCResult {
  /**
   * The result message or task
   */
  result: Message | Task;
}

/**
 * Response for send message
 */
export type SendMessageResponse = SendMessageSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to send a streaming message
 */
export interface SendMessageStreamingRequest extends JSONRPCRequest {
  /**
   * Fixed method for streaming messages
   */
  method: "message/sendStream";

  /**
   * Message parameters
   */
  params: MessageSendParams;
}

/**
 * Streaming success response
 */
export interface SendMessageStreamingSuccessResponse extends JSONRPCResult {
  /**
   * The result message for this chunk
   */
  result: Message;
}

/**
 * Response for streaming messages
 */
export type SendMessageStreamingResponse = SendMessageStreamingSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to get task details
 */
export interface GetTaskRequest extends JSONRPCRequest {
  /**
   * Fixed method for getting task
   */
  method: "tasks/get";

  /**
   * Task query parameters
   */
  params: TaskQueryParams;
}

/**
 * Success response for get task
 */
export interface GetTaskSuccessResponse extends JSONRPCResult {
  /**
   * The task result
   */
  result: Task;
}

/**
 * Response for get task
 */
export type GetTaskResponse = GetTaskSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to cancel a task
 */
export interface CancelTaskRequest extends JSONRPCRequest {
  /**
   * Fixed method for canceling tasks
   */
  method: "tasks/cancel";

  /**
   * Task ID parameters
   */
  params: TaskIdParams;
}

/**
 * Success response for cancel task
 */
export interface CancelTaskSuccessResponse extends JSONRPCResult {
  /**
   * The updated task
   */
  result: Task;
}

/**
 * Response for cancel task
 */
export type CancelTaskResponse = CancelTaskSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to set push notification config
 */
export interface SetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  /**
   * Fixed method for setting push notification config
   */
  method: "tasks/pushNotificationConfig/set";

  /**
   * Push notification config parameters
   */
  params: TaskPushNotificationConfig;
}

/**
 * Success response for setting task push notification config
 */
export interface SetTaskPushNotificationConfigSuccessResponse extends JSONRPCResult {
  /**
   * True if configuration was successful
   */
  result: boolean;
}

/**
 * Response for set task push notification config
 */
export type SetTaskPushNotificationConfigResponse = 
  | SetTaskPushNotificationConfigSuccessResponse 
  | JSONRPCErrorResponse;

/**
 * Request to get push notification config
 */
export interface GetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  /**
   * Fixed method for getting push notification config
   */
  method: "tasks/pushNotificationConfig/get";

  /**
   * Task ID parameters
   */
  params: TaskIdParams;
}

/**
 * Success response for getting task push notification config
 */
export interface GetTaskPushNotificationConfigSuccessResponse extends JSONRPCResult {
  /**
   * The push notification config
   */
  result: TaskPushNotificationConfig | null;
}

/**
 * Response for get task push notification config
 */
export type GetTaskPushNotificationConfigResponse = 
  | GetTaskPushNotificationConfigSuccessResponse 
  | JSONRPCErrorResponse;

/**
 * Task resubscription request
 */
export interface TaskResubscriptionRequest extends JSONRPCRequest {
  /**
   * Fixed method for resubscribing to task
   */
  method: "tasks/resubscribe";

  /**
   * Task ID parameters
   */
  params: TaskIdParams;
}

/**
 * Task status update event for streaming responses
 */
export interface TaskStatusUpdateEvent {
  /**
   * Task status was updated
   */
  type: "taskStatusUpdate";

  /**
   * Task ID
   */
  taskId: string;

  /**
   * New task state
   */
  state: TaskState;

  /**
   * Optional status message
   */
  statusMessage?: string;
}

/**
 * Task artifact update event for streaming responses
 */
export interface TaskArtifactUpdateEvent {
  /**
   * Task artifact was updated
   */
  type: "taskArtifactUpdate";

  /**
   * Task ID
   */
  taskId: string;

  /**
   * New artifact
   */
  artifact: TaskArtifact;
}

// Import required types from other modules
import type { 
  JSONRPCError,
  JSONRPCErrorResponse
} from './errors.js';

import type { 
  Message, 
  Task, 
  TaskState,
  TaskArtifact
} from './protocol_objects.js';
