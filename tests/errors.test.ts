import {
  JSONRPCErrorCode,
  JSONRPCError,
  JSONRPCErrorResponse,
  A2AError,
  TaskNotFoundError,
  UnsupportedOperationError,
  ContentTypeNotSupportedError
} from '../src/types';

describe('Error Types', () => {
  test('JSONRPCErrorCode enum should have correct values', () => {
    expect(JSONRPCErrorCode.ParseError).toBe(-32700);
    expect(JSONRPCErrorCode.InvalidRequest).toBe(-32600);
    expect(JSONRPCErrorCode.MethodNotFound).toBe(-32601);
    expect(JSONRPCErrorCode.InvalidParams).toBe(-32602);
    expect(JSONRPCErrorCode.InternalError).toBe(-32603);
    expect(JSONRPCErrorCode.ContentTypeNotSupported).toBe(-32005);
  });

  test('JSONRPCError objects should have correct structure', () => {
    const error: JSONRPCError = {
      code: JSONRPCErrorCode.InvalidRequest,
      message: 'Invalid Request'
    };

    expect(error.code).toBe(-32600);
    expect(error.message).toBe('Invalid Request');
    expect(error.data).toBeUndefined();

    const errorWithData: JSONRPCError = {
      code: JSONRPCErrorCode.MethodNotFound,
      message: 'Method not found',
      data: { method: 'unknown/method' }
    };

    expect(errorWithData.code).toBe(-32601);
    expect(errorWithData.message).toBe('Method not found');
    expect(errorWithData.data).toEqual({ method: 'unknown/method' });
  });

  test('JSONRPCErrorResponse should include error object', () => {
    const errorResp: JSONRPCErrorResponse = {
      jsonrpc: '2.0',
      error: {
        code: JSONRPCErrorCode.InvalidParams,
        message: 'Invalid parameters'
      },
      id: 'error-resp-1'
    };

    expect(errorResp.jsonrpc).toBe('2.0');
    expect(errorResp.error.code).toBe(-32602);
    expect(errorResp.error.message).toBe('Invalid parameters');
    expect(errorResp.id).toBe('error-resp-1');
  });

  test('Specialized error classes should be defined', () => {
    // Since A2AError is exported as a type, not a class, we can only check that
    // the error classes are defined as functions
    expect(typeof TaskNotFoundError).toBe('function');
    expect(typeof UnsupportedOperationError).toBe('function');
    expect(typeof ContentTypeNotSupportedError).toBe('function');
  });
});
