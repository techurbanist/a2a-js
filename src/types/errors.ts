/**
 * Error types for the A2A Protocol
 */

import { JSONRPCMessage } from './index.js';

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
 * Task not found error class
 */
export class TaskNotFoundError implements A2AError {
  type: "TaskNotFoundError" = "TaskNotFoundError";
  code: number = -32000;
  message: string = "Task not found";
  data?: any;

  constructor(data?: any) {
    this.data = data;
  }
}

/**
 * Unsupported operation error class
 */
export class UnsupportedOperationError implements A2AError {
  type: "UnsupportedOperationError" = "UnsupportedOperationError";
  code: number = -32001;
  message: string = "Operation not supported";
  data?: any;

  constructor(data?: any) {
    this.data = data;
  }
}

/**
 * Content type not supported error class
 */
export class ContentTypeNotSupportedError implements A2AError {
  type: "ContentTypeNotSupportedError" = "ContentTypeNotSupportedError";
  code: number = -32005;
  message: string = "Incompatible content types";
  data?: any;

  constructor(data?: any) {
    this.data = data;
  }
}
