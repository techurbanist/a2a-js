/**
 * @fileoverview Type definitions for A2A Protocol RPC Methods and JSON-RPC message structures.
 * @see docs/sections/7-Protocol-RPC-Methods.md
 *
 * These interfaces define the structure of JSON-RPC requests, responses, and streaming events for the A2A protocol.
 */

import type { 
  JSONRPCError,
  JSONRPCErrorResponse
} from './errors.js';

import type { 
  Message, 
  Task, 
  TaskState,
  Artifact,
  PushNotificationConfig,
  TaskStatus
} from './protocol_objects.js';

/**
 * Any JSON-RPC message conforming to JSON-RPC 2.0 spec.
 * @interface
 * @property {"2.0"} jsonrpc - Specifies the version of the JSON-RPC protocol. MUST be exactly "2.0".
 * @property {string|number|null} [id] - An identifier established by the Client. MUST be a String, Number, or null. Numbers SHOULD NOT contain fractional parts.
 */
export interface JSONRPCMessage {
  jsonrpc: "2.0";
  id?: string | number | null;
}

/**
 * JSON-RPC request object.
 * @interface
 * @augments JSONRPCMessage
 * @property {string} method - Name of the method to be invoked.
 * @property {Record<string, any>|null} [params] - Structured value holding the parameter values for the method. MAY be omitted if the method expects no parameters.
 */
export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: Record<string, any> | null;
}

/**
 * JSON-RPC successful response object.
 * @interface
 * @augments JSONRPCMessage
 * @property {*} result - The result object on success.
 */
export interface JSONRPCResult extends JSONRPCMessage {
  result: any;
}

/**
 * Parameters for sending a task (tasks/send, tasks/sendSubscribe).
 * @interface
 * @property {string} id - The ID for the task. If this is the first message for a new task, the client generates this ID. If this message continues an existing task, this ID MUST match the ID of the existing task.
 * @property {string|null} [sessionId] - Optional client-generated session ID to group this task with others.
 * @property {Message} message - The message to send to the agent. The `role` within this message is typically "user".
 * @property {PushNotificationConfig|null} [pushNotification] - Optional: sets push notification configuration for the task (usually on the first send). Requires server capability.
 * @property {number|null} [historyLength] - If positive, requests the server to include up to N recent messages in Task.history.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata for this specific request.
 */
export interface TaskSendParams {
  id: string;
  sessionId?: string | null;
  message: Message;
  pushNotification?: PushNotificationConfig | null;
  historyLength?: number | null;
  metadata?: Record<string, any> | null;
}

/**
 * Task query parameters for retrieving a task's current state (tasks/get).
 * @interface
 * @property {string} id - The ID of the task to retrieve.
 * @property {number|null} [historyLength] - If positive, requests the server to include up to N recent messages in Task.history.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata for this specific request.
 */
export interface TaskQueryParams {
  id: string;
  historyLength?: number | null;
  metadata?: Record<string, any> | null;
}

/**
 * Task ID parameters for operations that only need a task ID (e.g., tasks/cancel, tasks/pushNotificationConfig/get).
 * @interface
 * @property {string} id - The ID of the task.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata for this specific request.
 */
export interface TaskIdParams {
  id: string;
  metadata?: Record<string, any> | null;
}

/**
 * Parameters for sending a message (message/send, message/sendStream).
 * @interface
 * @property {Message} message - The message to send.
 */
export interface MessageSendParams {
  message: Message;
}

/**
 * Push notification configuration for a task (Section 6.10 of the A2A Protocol Specification).
 * @interface
 * @property {string} id - The ID of the task for which push notification settings are being configured or retrieved.
 * @property {PushNotificationConfig|null} pushNotificationConfig - The push notification configuration details.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata for this specific request.
 */
export interface TaskPushNotificationConfig {
  id: string;
  pushNotificationConfig: PushNotificationConfig | null;
  metadata?: Record<string, any> | null;
}

/**
 * Request to send a message (message/send).
 * @interface
 * @augments JSONRPCRequest
 * @property {"message/send"} method - Fixed method for sending messages.
 * @property {MessageSendParams} params - Message parameters.
 */
export interface SendMessageRequest extends JSONRPCRequest {
  method: "message/send";
  params: MessageSendParams;
}

/**
 * Success response for send message.
 * @interface
 * @augments JSONRPCResult
 * @property {Message|Task} result - The result message or task.
 */
export interface SendMessageSuccessResponse extends JSONRPCResult {
  result: Message | Task;
}

/**
 * Response for send message.
 * @typedef {SendMessageSuccessResponse|JSONRPCErrorResponse}
 */
export type SendMessageResponse = SendMessageSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to send a streaming message (message/sendStream).
 * @interface
 * @augments JSONRPCRequest
 * @property {"message/sendStream"} method - Fixed method for streaming messages.
 * @property {MessageSendParams} params - Message parameters.
 */
export interface SendMessageStreamingRequest extends JSONRPCRequest {
  method: "message/sendStream";
  params: MessageSendParams;
}

/**
 * Streaming success response.
 * @interface
 * @augments JSONRPCResult
 * @property {Message} result - The result message for this chunk.
 */
export interface SendMessageStreamingSuccessResponse extends JSONRPCResult {
  result: Message;
}

/**
 * Response for streaming messages.
 * @typedef {SendMessageStreamingSuccessResponse|JSONRPCErrorResponse}
 */
export type SendMessageStreamingResponse = SendMessageStreamingSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to get task details (tasks/get).
 * @interface
 * @augments JSONRPCRequest
 * @property {"tasks/get"} method - Fixed method for getting task.
 * @property {TaskQueryParams} params - Task query parameters.
 */
export interface GetTaskRequest extends JSONRPCRequest {
  method: "tasks/get";
  params: TaskQueryParams;
}

/**
 * Success response for get task.
 * @interface
 * @augments JSONRPCResult
 * @property {Task} result - The task result.
 */
export interface GetTaskSuccessResponse extends JSONRPCResult {
  result: Task;
}

/**
 * Response for get task.
 * @typedef {GetTaskSuccessResponse|JSONRPCErrorResponse}
 */
export type GetTaskResponse = GetTaskSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to cancel a task (tasks/cancel).
 * @interface
 * @augments JSONRPCRequest
 * @property {"tasks/cancel"} method - Fixed method for canceling tasks.
 * @property {TaskIdParams} params - Task ID parameters.
 */
export interface CancelTaskRequest extends JSONRPCRequest {
  method: "tasks/cancel";
  params: TaskIdParams;
}

/**
 * Success response for cancel task.
 * @interface
 * @augments JSONRPCResult
 * @property {Task} result - The updated task.
 */
export interface CancelTaskSuccessResponse extends JSONRPCResult {
  result: Task;
}

/**
 * Response for cancel task.
 * @typedef {CancelTaskSuccessResponse|JSONRPCErrorResponse}
 */
export type CancelTaskResponse = CancelTaskSuccessResponse | JSONRPCErrorResponse;

/**
 * Request to set push notification config (tasks/pushNotificationConfig/set).
 * @interface
 * @augments JSONRPCRequest
 * @property {"tasks/pushNotificationConfig/set"} method - Fixed method for setting push notification config.
 * @property {TaskPushNotificationConfig} params - Push notification config parameters.
 */
export interface SetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: "tasks/pushNotificationConfig/set";
  params: TaskPushNotificationConfig;
}

/**
 * Success response for setting task push notification config.
 * @interface
 * @augments JSONRPCResult
 * @property {boolean} result - True if configuration was successful.
 */
export interface SetTaskPushNotificationConfigSuccessResponse extends JSONRPCResult {
  result: boolean;
}

/**
 * Response for set task push notification config.
 * @typedef {SetTaskPushNotificationConfigSuccessResponse|JSONRPCErrorResponse}
 */
export type SetTaskPushNotificationConfigResponse = 
  | SetTaskPushNotificationConfigSuccessResponse 
  | JSONRPCErrorResponse;

/**
 * Request to get push notification config (tasks/pushNotificationConfig/get).
 * @interface
 * @augments JSONRPCRequest
 * @property {"tasks/pushNotificationConfig/get"} method - Fixed method for getting push notification config.
 * @property {TaskIdParams} params - Task ID parameters.
 */
export interface GetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: "tasks/pushNotificationConfig/get";
  params: TaskIdParams;
}

/**
 * Success response for getting task push notification config.
 * @interface
 * @augments JSONRPCResult
 * @property {TaskPushNotificationConfig|null} result - The push notification config.
 */
export interface GetTaskPushNotificationConfigSuccessResponse extends JSONRPCResult {
  result: TaskPushNotificationConfig | null;
}

/**
 * Response for get task push notification config.
 * @typedef {GetTaskPushNotificationConfigSuccessResponse|JSONRPCErrorResponse}
 */
export type GetTaskPushNotificationConfigResponse = 
  | GetTaskPushNotificationConfigSuccessResponse 
  | JSONRPCErrorResponse;

/**
 * Task resubscription request (tasks/resubscribe).
 * @interface
 * @augments JSONRPCRequest
 * @property {"tasks/resubscribe"} method - Fixed method for resubscribing to task.
 * @property {TaskIdParams} params - Task ID parameters.
 */
export interface TaskResubscriptionRequest extends JSONRPCRequest {
  method: "tasks/resubscribe";
  params: TaskIdParams;
}

/**
 * Task status update event for streaming responses (Section 7.2.2 of the A2A Protocol Specification).
 * @interface
 * @property {"taskStatusUpdate"} type - Event type discriminator.
 * @property {string} id - The ID of the task being updated.
 * @property {TaskStatus} status - The new status object for the task.
 * @property {boolean} [final=false] - If true, indicates this is the terminal status update for the current stream cycle. The server typically closes the SSE connection after this.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata for this specific status update event.
 */
export interface TaskStatusUpdateEvent {
  type: "taskStatusUpdate";
  id: string;
  status: TaskStatus;
  final?: boolean;
  metadata?: Record<string, any> | null;
}

/**
 * Task artifact update event for streaming responses (Section 7.2.3 of the A2A Protocol Specification).
 * @interface
 * @property {"taskArtifactUpdate"} type - Event type discriminator.
 * @property {string} id - Task ID.
 * @property {Artifact} artifact - New artifact.
 * @property {Record<string, any>|null} [metadata] - Arbitrary metadata associated with the artifact.
 */
export interface TaskArtifactUpdateEvent {
  type: "taskArtifactUpdate";
  id: string;
  artifact: Artifact;
  metadata?: Record<string, any> | null;
}

/**
 * Response for sending a task in streaming mode (Section 7.2.1 of the A2A Protocol Specification).
 * @interface
 * @augments JSONRPCResult
 * @property {string|number} id - The id MUST match the id from the originating tasks/sendSubscribe (or tasks/resubscribe) JSON-RPC request that established this SSE stream.
 * @property {TaskStatusUpdateEvent|TaskArtifactUpdateEvent} result - The event payload for this streaming update.
 * @property {JSONRPCError|null} [error] - For streaming events, error is typically null or absent. If a fatal error occurs that terminates the stream, the server MAY send a final SSE event with this error field populated before closing the connection.
 */
export interface SendTaskStreamingResponse extends JSONRPCResult {
  id: string | number;
  result: TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
  error?: JSONRPCError | null;
}
