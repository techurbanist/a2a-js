/**
 * Type definitions for the A2A Protocol
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
 * JSON-RPC error codes as defined in the spec
 */
export enum JSONRPCErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ContentTypeNotSupported = -32005,
}

/**
 * JSON-RPC error object
 */
export interface JSONRPCError {
  /**
   * A Number that indicates the error type that occurred.
   */
  code: number;

  /**
   * A String providing a short description of the error.
   */
  message: string;

  /**
   * A Primitive or Structured value that contains additional information about the error.
   * This may be omitted.
   */
  data?: any;
}

/**
 * JSON-RPC error response
 */
export interface JSONRPCErrorResponse extends JSONRPCMessage {
  /**
   * The error that occurred
   */
  error: JSONRPCError;
}

/**
 * The role of the message sender
 */
export enum Role {
  Agent = "agent",
  User = "user",
}

/**
 * Base properties common to all message parts
 */
export interface PartBase {
  /**
   * Optional metadata associated with the part
   */
  metadata?: Record<string, any>;
}

/**
 * Text part in a message
 */
export interface TextPart extends PartBase {
  /**
   * Part type - text for TextParts
   */
  type: "text";

  /**
   * Text content
   */
  text: string;
}

/**
 * Data part in a message
 */
export interface DataPart extends PartBase {
  /**
   * Part type - data for DataParts
   */
  type: "data";

  /**
   * Structured data content
   */
  data: Record<string, any>;
}

/**
 * Base file part
 */
export interface FileBase {
  /**
   * Optional name for the file
   */
  name?: string;

  /**
   * Optional mimeType for the file
   */
  mimeType?: string;
}

/**
 * File with URI
 */
export interface FileWithUri extends FileBase {
  /**
   * URI to the file
   */
  uri: string;
}

/**
 * File with bytes
 */
export interface FileWithBytes extends FileBase {
  /**
   * Base64 encoded content of the file
   */
  bytes: string;
}

/**
 * File part in a message
 */
export interface FilePart extends PartBase {
  /**
   * Part type - file for FileParts
   */
  type: "file";

  /**
   * The file content - either URI or bytes
   */
  file: FileWithUri | FileWithBytes;
}

/**
 * Union type of all possible message parts
 */
export type Part = TextPart | DataPart | FilePart;

/**
 * Represents a message in the A2A protocol
 */
export interface Message {
  /**
   * Unique identifier for the message
   */
  messageId: string;

  /**
   * Message sender's role
   */
  role: Role;

  /**
   * The parts that make up the message content
   */
  parts: Part[];

  /**
   * Task ID the message is associated with (optional)
   */
  taskId?: string;

  /**
   * Whether this message is the final one in a stream (optional)
   */
  final?: boolean;
}

/**
 * Represents the task state
 */
export enum TaskState {
  Active = "active",
  Completed = "completed",
  Failed = "failed",
  Canceled = "canceled",
}

/**
 * Task artifact
 */
export interface TaskArtifact {
  /**
   * Unique identifier for the artifact
   */
  artifactId: string;

  /**
   * Mime type of the artifact
   */
  mimeType: string;

  /**
   * The URI where the artifact can be accessed
   */
  uri?: string;

  /**
   * Base64 encoded content of the artifact
   */
  bytes?: string;
}

/**
 * Represents a Task in the A2A protocol
 */
export interface Task {
  /**
   * Unique identifier for the task
   */
  taskId: string;

  /**
   * Current state of the task
   */
  state: TaskState;

  /**
   * Task creation timestamp
   */
  createdAt: string;

  /**
   * Timestamp of the last update
   */
  updatedAt: string;

  /**
   * The input message that created the task
   */
  input: Message;

  /**
   * Output messages produced during task execution
   */
  messages: Message[];

  /**
   * Optional artifacts produced by the task
   */
  artifacts?: TaskArtifact[];

  /**
   * Optional status message for the task
   */
  statusMessage?: string;
}

/**
 * Represents the authentication requirements for an agent
 */
export interface AgentAuthentication {
  /**
   * Authentication schemes supported (e.g. Basic, Bearer)
   */
  schemes: string[];

  /**
   * Credentials a client should use for private cards
   */
  credentials?: string;
}

/**
 * Represents optional capabilities supported by an agent
 */
export interface AgentCapabilities {
  /**
   * True if the agent can notify updates to client
   */
  pushNotifications?: boolean;

  /**
   * True if the agent exposes status change history for tasks
   */
  stateTransitionHistory?: boolean;

  /**
   * True if the agent supports server-sent events
   */
  streaming?: boolean;
}

/**
 * Represents a service provider of an agent
 */
export interface AgentProvider {
  /**
   * Agent provider's organization name
   */
  organization: string;

  /**
   * Agent provider's URL
   */
  url: string;
}

/**
 * Represents a unit of capability that an agent can perform
 */
export interface AgentSkill {
  /**
   * Unique identifier for the agent's skill
   */
  id: string;

  /**
   * Human readable name of the skill
   */
  name: string;

  /**
   * Description of the skill
   */
  description: string;

  /**
   * Set of tagwords describing classes of capabilities for this specific skill
   */
  tags: string[];

  /**
   * Example scenarios that the skill can perform
   */
  examples?: string[];

  /**
   * The set of interaction modes that the skill supports
   */
  inputModes?: string[];

  /**
   * Supported mime types for output
   */
  outputModes?: string[];
}

/**
 * Represents an agent card containing metadata about an agent
 */
export interface AgentCard {
  /**
   * Name of the agent
   */
  name: string;

  /**
   * Description of the agent
   */
  description: string;

  /**
   * URL where the agent API is accessible
   */
  url: string;

  /**
   * Version of the agent
   */
  version: string;

  /**
   * Default input modes supported by the agent
   */
  defaultInputModes: string[];

  /**
   * Default output modes supported by the agent
   */
  defaultOutputModes: string[];

  /**
   * Skills provided by the agent
   */
  skills: AgentSkill[];

  /**
   * Authentication details
   */
  authentication: AgentAuthentication;

  /**
   * Optional agent capabilities
   */
  capabilities?: AgentCapabilities;

  /**
   * Agent provider information
   */
  provider?: AgentProvider;
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
 * Task query parameters
 */
export interface TaskQueryParams {
  /**
   * ID of the task to query
   */
  id: string;
}

/**
 * Task ID parameters
 */
export interface TaskIdParams {
  /**
   * ID of the task
   */
  id: string;
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
export type SendMessageResponse =
  | SendMessageSuccessResponse
  | JSONRPCErrorResponse;

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
export type SendMessageStreamingResponse =
  | SendMessageStreamingSuccessResponse
  | JSONRPCErrorResponse;

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
export type CancelTaskResponse =
  | CancelTaskSuccessResponse
  | JSONRPCErrorResponse;

/**
 * Push notification configuration for a task
 */
export interface TaskPushNotificationConfig extends TaskIdParams {
  /**
   * Callback URL for push notifications
   */
  callbackUrl: string;

  /**
   * Optional authentication token for the callback
   */
  authToken?: string;
}

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
export interface SetTaskPushNotificationConfigSuccessResponse
  extends JSONRPCResult {
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
export interface GetTaskPushNotificationConfigSuccessResponse
  extends JSONRPCResult {
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
 * Task status update event
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
 * Task artifact update event
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

/**
 * A2A specific errors
 */
export interface A2AError {
  /**
   * Task not found error
   */
  type:
    | "TaskNotFoundError"
    | "UnsupportedOperationError"
    | "ContentTypeNotSupportedError";

  /**
   * Error code
   */
  code: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Additional error data
   */
  data?: any;
}

/**
 * Task not found error
 */
export const TaskNotFoundError: A2AError = {
  type: "TaskNotFoundError",
  code: -32000,
  message: "Task not found",
};

/**
 * Unsupported operation error
 */
export const UnsupportedOperationError: A2AError = {
  type: "UnsupportedOperationError",
  code: -32001,
  message: "Operation not supported",
};

/**
 * Content type not supported error
 */
export const ContentTypeNotSupportedError: A2AError = {
  type: "ContentTypeNotSupportedError",
  code: -32005,
  message: "Incompatible content types",
};
