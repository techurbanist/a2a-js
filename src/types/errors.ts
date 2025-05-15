/**
 * @fileoverview Error types and codes for the A2A Protocol, based on Section 8 of the A2A Protocol Specification.
 * @see docs/sections/8-Error-Handling.md
 */

import { JSONRPCMessage } from './index.js';

/**
 * JSON-RPC error codes as defined in the A2A Protocol Specification.
 *
 * Standard JSON-RPC codes:
 *   -32700: Parse error - Invalid JSON was received by the server.
 *   -32600: Invalid Request - The JSON sent is not a valid Request object.
 *   -32601: Method not found - The method does not exist or is not available.
 *   -32602: Invalid params - Invalid method parameter(s).
 *   -32603: Internal error - Internal JSON-RPC error.
 *
 * A2A-specific error codes (range -32000 to -32099):
 *   -32001: TaskNotFoundError - The specified task id does not correspond to an existing or active task.
 *   -32002: TaskNotCancelableError - Attempt to cancel a task that is not in a cancelable state.
 *   -32003: PushNotificationNotSupportedError - Push notification features are not supported by the agent.
 *   -32004: OperationNotSupportedError - The requested operation or aspect is not supported by this agent.
 *   -32005: ContentTypeNotSupportedError - Provided MIME type is not supported by the agent or skill.
 *   -32006: StreamingNotSupportedError - Streaming is not supported by the agent.
 *   -32007: AuthenticationRequiredError - Authentication credentials are missing or invalid.
 *   -32008: AuthorizationFailedError - Authenticated identity is not authorized for the requested action.
 *   -32009: InvalidTaskStateError - Operation is not valid for the task's current state.
 *   -32010: RateLimitExceededError - Too many requests in a given amount of time.
 *   -32011: ResourceUnavailableError - A required resource is unavailable.
 *
 * @enum {number}
 */
export enum JSONRPCErrorCode {
  /** Parse error: Invalid JSON payload */
  ParseError = -32700,
  /** Invalid Request: Not a valid JSON-RPC Request object */
  InvalidRequest = -32600,
  /** Method not found: The requested method does not exist */
  MethodNotFound = -32601,
  /** Invalid params: Invalid method parameters */
  InvalidParams = -32602,
  /** Internal error: Internal server error */
  InternalError = -32603,
  /** ContentTypeNotSupportedError: Incompatible content types */
  ContentTypeNotSupported = -32005,
  // A2A-specific error codes (from -32000 to -32099)
  /** TaskNotFoundError: The specified task id does not exist or is not active */
  TaskNotFound = -32001,
  /** TaskNotCancelableError: Task cannot be canceled in its current state */
  TaskNotCancelable = -32002,
  /** PushNotificationNotSupportedError: Push notification features not supported */
  PushNotificationNotSupported = -32003,
  /** OperationNotSupportedError: The requested operation is not supported */
  OperationNotSupported = -32004,
  /** StreamingNotSupportedError: Streaming is not supported by the agent */
  StreamingNotSupported = -32006,
  /** AuthenticationRequiredError: Authentication required or invalid */
  AuthenticationRequired = -32007,
  /** AuthorizationFailedError: Not authorized for the requested action */
  AuthorizationFailed = -32008,
  /** InvalidTaskStateError: Operation not valid for the task's current state */
  InvalidTaskState = -32009,
  /** RateLimitExceededError: Too many requests */
  RateLimitExceeded = -32010,
  /** ResourceUnavailableError: A required resource is unavailable */
  ResourceUnavailable = -32011,
}

/**
 * JSON-RPC error object, as per the JSON-RPC 2.0 and A2A Protocol Specification.
 *
 * @interface
 * @property {number} code - Integer error code. See Section 8 for standard and A2A-specific codes.
 * @property {string} message - Short, human-readable summary of the error.
 * @property {*} [data] - Optional additional structured information about the error.
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * JSON-RPC error response object, as per the JSON-RPC 2.0 and A2A Protocol Specification.
 *
 * @interface
 * @augments JSONRPCMessage
 * @property {JSONRPCError} error - The error that occurred.
 */
export interface JSONRPCErrorResponse extends JSONRPCMessage {
  error: JSONRPCError;
}

/**
 * A2A-specific error object, for errors in the -32000 to -32099 range.
 *
 * @interface
 * @property {string} type - The error type string, e.g. "TaskNotFoundError".
 * @property {number} code - Integer error code (see JSONRPCErrorCode).
 * @property {string} message - Short, human-readable summary of the error.
 * @property {*} [data] - Optional additional structured information about the error.
 */
export interface A2AError {
  type:
    | "TaskNotFoundError"
    | "TaskNotCancelableError"
    | "PushNotificationNotSupportedError"
    | "OperationNotSupportedError"
    | "ContentTypeNotSupportedError"
    | "StreamingNotSupportedError"
    | "AuthenticationRequiredError"
    | "AuthorizationFailedError"
    | "InvalidTaskStateError"
    | "RateLimitExceededError"
    | "ResourceUnavailableError";
  code: number;
  message: string;
  data?: unknown;
}

/**
 * TaskNotFoundError (-32001)
 * The specified task id does not correspond to an existing or active task. It might be invalid, expired, or already completed and purged.
 *
 * @implements {A2AError}
 */
export class TaskNotFoundError implements A2AError {
  type = "TaskNotFoundError" as const;
  code = JSONRPCErrorCode.TaskNotFound;
  message = "Task not found";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * TaskNotCancelableError (-32002)
 * An attempt was made to cancel a task that is not in a cancelable state (e.g., already completed, failed, or canceled).
 *
 * @implements {A2AError}
 */
export class TaskNotCancelableError implements A2AError {
  type = "TaskNotCancelableError" as const;
  code = JSONRPCErrorCode.TaskNotCancelable;
  message = "Task cannot be canceled";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * PushNotificationNotSupportedError (-32003)
 * Client attempted to use push notification features but the server agent does not support them.
 *
 * @implements {A2AError}
 */
export class PushNotificationNotSupportedError implements A2AError {
  type = "PushNotificationNotSupportedError" as const;
  code = JSONRPCErrorCode.PushNotificationNotSupported;
  message = "Push Notification is not supported";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * OperationNotSupportedError (-32004)
 * The requested operation or a specific aspect of it is not supported by this server agent implementation.
 * Broader than just method not found.
 *
 * @implements {A2AError}
 */
export class OperationNotSupportedError implements A2AError {
  type = "OperationNotSupportedError" as const;
  code = JSONRPCErrorCode.OperationNotSupported;
  message = "This operation is not supported";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * ContentTypeNotSupportedError (-32005)
 * A MIME type provided in the request's message.parts (or implied for an artifact) is not supported by the agent or the specific skill being invoked.
 *
 * @implements {A2AError}
 */
export class ContentTypeNotSupportedError implements A2AError {
  type = "ContentTypeNotSupportedError" as const;
  code = JSONRPCErrorCode.ContentTypeNotSupported;
  message = "Incompatible content types";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * StreamingNotSupportedError (-32006)
 * Client attempted tasks/sendSubscribe or tasks/resubscribe but the server agent does not support streaming.
 *
 * @implements {A2AError}
 */
export class StreamingNotSupportedError implements A2AError {
  type = "StreamingNotSupportedError" as const;
  code = JSONRPCErrorCode.StreamingNotSupported;
  message = "Streaming is not supported";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * AuthenticationRequiredError (-32007)
 * The request lacks necessary authentication credentials, or the provided credentials are invalid or insufficient.
 * This often accompanies an HTTP 401 Unauthorized status.
 *
 * @implements {A2AError}
 */
export class AuthenticationRequiredError implements A2AError {
  type = "AuthenticationRequiredError" as const;
  code = JSONRPCErrorCode.AuthenticationRequired;
  message = "Authentication required";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * AuthorizationFailedError (-32008)
 * The authenticated identity is not authorized to perform the requested action or access the specified resource.
 * This often accompanies an HTTP 403 Forbidden status.
 *
 * @implements {A2AError}
 */
export class AuthorizationFailedError implements A2AError {
  type = "AuthorizationFailedError" as const;
  code = JSONRPCErrorCode.AuthorizationFailed;
  message = "Authorization failed";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * InvalidTaskStateError (-32009)
 * The operation is not valid for the task's current TaskState (e.g., trying to send a message to a task that is already completed).
 *
 * @implements {A2AError}
 */
export class InvalidTaskStateError implements A2AError {
  type = "InvalidTaskStateError" as const;
  code = JSONRPCErrorCode.InvalidTaskState;
  message = "Invalid task state for operation";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * RateLimitExceededError (-32010)
 * The client has made too many requests in a given amount of time.
 *
 * @implements {A2AError}
 */
export class RateLimitExceededError implements A2AError {
  type = "RateLimitExceededError" as const;
  code = JSONRPCErrorCode.RateLimitExceeded;
  message = "Rate limit exceeded";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}

/**
 * ResourceUnavailableError (-32011)
 * The server cannot complete the request because a necessary downstream resource or service is temporarily or permanently unavailable.
 *
 * @implements {A2AError}
 */
export class ResourceUnavailableError implements A2AError {
  type = "ResourceUnavailableError" as const;
  code = JSONRPCErrorCode.ResourceUnavailable;
  message = "A required resource is unavailable";
  data?: unknown;
  constructor(data?: unknown) {
    this.data = data;
  }
}
