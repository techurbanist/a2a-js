/**
 * A2A Client errors
 */

/**
 * Base error class for A2A client errors
 */
export class A2AClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when HTTP request fails
 */
export class A2AClientHTTPError extends A2AClientError {
  /**
   * HTTP status code
   */
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when JSON parsing fails
 */
export class A2AClientJSONError extends A2AClientError {
  constructor(message: string) {
    super(`JSON error: ${message}`);
  }
}

/**
 * Error thrown when SSE response is invalid
 */
export class A2AClientSSEError extends A2AClientError {
  constructor(message: string) {
    super(`SSE error: ${message}`);
  }
}
