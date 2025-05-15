import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResult,
  MessageSendParams,
  SendMessageRequest,
  SendMessageSuccessResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingSuccessResponse,
  GetTaskRequest,
  GetTaskSuccessResponse,
  CancelTaskRequest,
  CancelTaskSuccessResponse,
  TaskSendParams,
  TaskQueryParams,
  TaskIdParams,
  TaskPushNotificationConfig,
  SetTaskPushNotificationConfigRequest,
  SetTaskPushNotificationConfigSuccessResponse,
  GetTaskPushNotificationConfigRequest,
  GetTaskPushNotificationConfigSuccessResponse,
  TaskResubscriptionRequest,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  SendTaskStreamingResponse
} from '../../src/types/rpc_methods';
import {
  Message,
  TextPart,
  Role,
  Task,
  TaskStatus,
  TaskState,
  Artifact,
  PushNotificationConfig
} from '../../src/types/protocol_objects';
import { JSONRPCErrorResponse } from '../../src/types/errors';

describe('JSON-RPC Base Types', () => {
  test('JSON-RPC Message should have jsonrpc version 2.0', () => {
    const message: JSONRPCMessage = { 
      jsonrpc: '2.0', 
      id: 1 
    };
    expect(message.jsonrpc).toBe('2.0');
    expect(message.id).toBe(1);
  });

  test('JSON-RPC Request should include method', () => {
    const request: JSONRPCRequest = { 
      jsonrpc: '2.0', 
      method: 'test_method',
      id: 1 
    };
    expect(request.method).toBe('test_method');
    expect(request.params).toBeUndefined();

    const requestWithParams: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'add',
      params: { a: 1, b: 2 },
      id: 'req-1'
    };
    expect(requestWithParams.params).toEqual({ a: 1, b: 2 });
  });

  test('JSON-RPC Result should have result property', () => {
    const result: JSONRPCResult = {
      jsonrpc: '2.0',
      result: { success: true },
      id: 'result-1'
    };
    expect(result.jsonrpc).toBe('2.0');
    expect(result.result).toEqual({ success: true });
    expect(result.id).toBe('result-1');
  });
});

describe('RPC Methods Types', () => {
  // Setup test data
  const textPart: TextPart = {
    type: 'text',
    text: 'Hello from request'
  };

  const message: Message = {
    role: Role.User,
    parts: [textPart]
  };

  // Test Message Send related types
  describe('Message Send Methods', () => {
    test('SendMessageRequest should have correct format', () => {
      const params: MessageSendParams = {
        message
      };

      const request: SendMessageRequest = {
        jsonrpc: '2.0',
        method: 'message/send',
        params,
        id: 'req-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('message/send');
      expect(request.params.message.parts[0].type).toBe('text');
      expect(request.id).toBe('req-123');
    });

    test('SendMessageSuccessResponse should have correct format', () => {
      const response: SendMessageSuccessResponse = {
        jsonrpc: '2.0',
        result: message,
        id: 'resp-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('resp-123');
      // Since result can be Message or Task, we need to assert the type first
      if ('role' in response.result) {
        expect(response.result.role).toBe(Role.User);
      } else {
        expect(response.result.id).toBeDefined();
        expect(response.result.status).toBeDefined();
      }
    });

    test('SendMessageStreamingRequest should have correct format', () => {
      const params: MessageSendParams = {
        message
      };

      const request: SendMessageStreamingRequest = {
        jsonrpc: '2.0',
        method: 'message/sendStream',
        params,
        id: 'req-stream-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('message/sendStream');
      expect(request.params.message.role).toBe(Role.User);
      expect(request.id).toBe('req-stream-123');
    });

    test('SendMessageStreamingSuccessResponse should have correct format', () => {
      const response: SendMessageStreamingSuccessResponse = {
        jsonrpc: '2.0',
        result: message,
        id: 'resp-stream-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('resp-stream-123');
      expect(response.result.role).toBe(Role.User);
    });
  });

  // Test Task related types
  describe('Task Methods', () => {
    test('GetTaskRequest should have correct format', () => {
      const params: TaskQueryParams = {
        id: 'task-123'
      };

      const request: GetTaskRequest = {
        jsonrpc: '2.0',
        method: 'tasks/get',
        params,
        id: 'get-task-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('tasks/get');
      expect(request.params.id).toBe('task-123');
      expect(request.id).toBe('get-task-123');
    });

    test('TaskIdParams should have required fields', () => {
      const params: TaskIdParams = {
        id: 'task-456'
      };

      expect(params.id).toBe('task-456');
    });

    test('TaskSendParams should have required fields', () => {
      const params: TaskSendParams = {
        id: 'task-789',
        message
      };

      expect(params.id).toBe('task-789');
      expect(params.message.role).toBe(Role.User);
      expect(params.sessionId).toBeUndefined();
      expect(params.pushNotification).toBeUndefined();
      expect(params.historyLength).toBeUndefined();
      expect(params.metadata).toBeUndefined();

      // Test with optional fields
      const paramsWithOptionals: TaskSendParams = {
        id: 'task-789',
        message,
        sessionId: 'session-123',
        historyLength: 10,
        metadata: { custom: 'data' }
      };

      expect(paramsWithOptionals.sessionId).toBe('session-123');
      expect(paramsWithOptionals.historyLength).toBe(10);
      expect(paramsWithOptionals.metadata).toEqual({ custom: 'data' });
    });

    test('CancelTaskRequest should have correct format', () => {
      const request: CancelTaskRequest = {
        jsonrpc: '2.0',
        method: 'tasks/cancel',
        params: {
          id: 'task-to-cancel'
        },
        id: 'cancel-req-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('tasks/cancel');
      expect(request.params.id).toBe('task-to-cancel');
      expect(request.id).toBe('cancel-req-123');
    });

    test('CancelTaskSuccessResponse should have correct format', () => {
      const inputMessage: Message = {
        role: Role.User,
        parts: [{ type: 'text', text: 'Cancel request' }]
      };

      const cancelledTaskStatus: TaskStatus = {
        state: TaskState.Canceled,
        message: {
          role: Role.Agent,
          parts: [{ type: 'text', text: 'Task has been canceled' }]
        }
      };
      
      const taskCancelled: Task = {
        id: 'canceled-task',
        status: cancelledTaskStatus,
        history: [inputMessage]
      };

      const response: CancelTaskSuccessResponse = {
        jsonrpc: '2.0',
        result: taskCancelled,
        id: 'cancel-resp-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.result.id).toBe('canceled-task');
      expect(response.result.status).toEqual(cancelledTaskStatus);
      expect(response.id).toBe('cancel-resp-123');
    });

    test('GetTaskSuccessResponse should have correct format', () => {
      const inputMessage: Message = {
        role: Role.User,
        parts: [{ type: 'text', text: 'Get task request' }]
      };

      const workingTaskStatus: TaskStatus = {
        state: TaskState.Working,
        message: {
          role: Role.Agent,
          parts: [{ type: 'text', text: 'Task is running' }]
        }
      };
      
      const taskWorking: Task = {
        id: 'task-123',
        status: workingTaskStatus,
        history: [inputMessage]
      };

      const response: GetTaskSuccessResponse = {
        jsonrpc: '2.0',
        result: taskWorking,
        id: 'get-task-resp-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.result.id).toBe('task-123');
      expect(response.result.status).toBe(workingTaskStatus);
      expect(response.id).toBe('get-task-resp-123');
    });

    test('TaskResubscriptionRequest should have correct format', () => {
      const request: TaskResubscriptionRequest = {
        jsonrpc: '2.0',
        method: 'tasks/resubscribe',
        params: {
          id: 'task-to-resubscribe'
        },
        id: 'resubscribe-req-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('tasks/resubscribe');
      expect(request.params.id).toBe('task-to-resubscribe');
      expect(request.id).toBe('resubscribe-req-123');
    });
  });

  // Test Push Notification related types
  describe('Push Notification Methods', () => {
    test('PushNotificationConfig should have required fields', () => {
      const config: PushNotificationConfig = {
        url: 'https://example.com/callback'
      };

      expect(config.url).toBe('https://example.com/callback');
      expect(config.token).toBeUndefined();
      expect(config.authentication).toBeUndefined();

      // Test with optional fields
      const configWithOptionals: PushNotificationConfig = {
        url: 'https://example.com/callback',
        token: 'abc123',
        authentication: {
          schemes: ['Bearer'],
          credentials: 'xyz123'
        }
      };

      expect(configWithOptionals.token).toBe('abc123');
      expect(configWithOptionals.authentication?.schemes).toEqual(['Bearer']);
      expect(configWithOptionals.authentication?.credentials).toBe('xyz123');
    });

    test('TaskPushNotificationConfig should have required fields', () => {
      const pushConfig: PushNotificationConfig = {
        url: 'https://example.com/callback'
      };
      
      const config: TaskPushNotificationConfig = {
        id: 'task-123',
        pushNotificationConfig: pushConfig
      };

      expect(config.id).toBe('task-123');
      expect(config.pushNotificationConfig).toBe(pushConfig);
      expect(config.metadata).toBeUndefined();

      // Test with optional fields
      const configWithOptionals: TaskPushNotificationConfig = {
        id: 'task-123',
        pushNotificationConfig: pushConfig,
        metadata: { source: 'test' }
      };

      expect(configWithOptionals.metadata).toEqual({ source: 'test' });
    });

    test('SetTaskPushNotificationConfigRequest should have correct format', () => {
      const pushConfig: PushNotificationConfig = {
        url: 'https://example.com/callback'
      };
      
      const request: SetTaskPushNotificationConfigRequest = {
        jsonrpc: '2.0',
        method: 'tasks/pushNotificationConfig/set',
        params: {
          id: 'task-123',
          pushNotificationConfig: pushConfig
        },
        id: 'set-push-req-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('tasks/pushNotificationConfig/set');
      expect(request.params.id).toBe('task-123');
      expect(request.params.pushNotificationConfig).toBe(pushConfig);
      expect(request.id).toBe('set-push-req-123');
    });

    test('SetTaskPushNotificationConfigSuccessResponse should have correct format', () => {
      const response: SetTaskPushNotificationConfigSuccessResponse = {
        jsonrpc: '2.0',
        result: true,
        id: 'set-push-resp-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.result).toBe(true);
      expect(response.id).toBe('set-push-resp-123');
    });

    test('GetTaskPushNotificationConfigRequest should have correct format', () => {
      const request: GetTaskPushNotificationConfigRequest = {
        jsonrpc: '2.0',
        method: 'tasks/pushNotificationConfig/get',
        params: {
          id: 'task-123'
        },
        id: 'get-push-req-123'
      };

      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('tasks/pushNotificationConfig/get');
      expect(request.params.id).toBe('task-123');
      expect(request.id).toBe('get-push-req-123');
    });

    test('GetTaskPushNotificationConfigSuccessResponse should have correct format', () => {
      const pushConfig: PushNotificationConfig = {
        url: 'https://example.com/callback'
      };
      
      const config: TaskPushNotificationConfig = {
        id: 'task-123',
        pushNotificationConfig: pushConfig
      };

      const response: GetTaskPushNotificationConfigSuccessResponse = {
        jsonrpc: '2.0',
        result: config,
        id: 'get-push-resp-123'
      };

      expect(response.jsonrpc).toBe('2.0');
      expect(response.result?.id).toBe('task-123');
      expect(response.result?.pushNotificationConfig).toBe(pushConfig);
      expect(response.id).toBe('get-push-resp-123');

      // Test with null result
      const nullResponse: GetTaskPushNotificationConfigSuccessResponse = {
        jsonrpc: '2.0',
        result: null,
        id: 'get-push-null-resp-123'
      };

      expect(nullResponse.result).toBeNull();
    });
  });

  // Test Event types for streaming responses
  describe('Task Event Types', () => {
    test('TaskStatusUpdateEvent should have correct format', () => {
      const taskStatus: TaskStatus = {
        state: TaskState.Working,
        message: null
      };
      const event: TaskStatusUpdateEvent = {
        type: 'taskStatusUpdate',
        id: 'task-evt-1',
        status: taskStatus,
        final: true,
        metadata: { foo: 'bar' }
      };
      expect(event.type).toBe('taskStatusUpdate');
      expect(event.id).toBe('task-evt-1');
      expect(event.status).toBe(taskStatus);
      expect(event.final).toBe(true);
      expect(event.metadata).toEqual({ foo: 'bar' });
    });

    test('TaskArtifactUpdateEvent should have correct format', () => {
      const artifact: Artifact = {
        name: 'artifact.txt',
        parts: [
          {
            type: 'file',
            file: {
              name: 'artifact.txt',
              mimeType: 'text/plain',
              uri: 'file://artifact.txt'
            }
          }
        ],
        index: 0
      };
      const event: TaskArtifactUpdateEvent = {
        type: 'taskArtifactUpdate',
        id: 'task-evt-2',
        artifact,
        metadata: { foo: 'baz' }
      };
      expect(event.type).toBe('taskArtifactUpdate');
      expect(event.id).toBe('task-evt-2');
      expect(event.artifact).toBe(artifact);
      expect(event.metadata).toEqual({ foo: 'baz' });
    });
  });

  // Test error response format
  describe('Error Response Types', () => {
    test('JSONRPCErrorResponse should have correct format for A2A RPC methods', () => {
      const errorResp: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Task not found',
          data: { id: 'missing-task' }
        },
        id: 'err-123'
      };
      expect(errorResp.jsonrpc).toBe('2.0');
      expect(errorResp.error.code).toBe(-32001);
      expect(errorResp.error.message).toBe('Task not found');
      expect(errorResp.error.data).toEqual({ id: 'missing-task' });
      expect(errorResp.id).toBe('err-123');
    });
  });

  // Test SendTaskStreamingResponse format
  describe('SendTaskStreamingResponse Types', () => {
    test('SendTaskStreamingResponse should have correct format', () => {
      const statusEvent: TaskStatusUpdateEvent = {
        type: 'taskStatusUpdate',
        id: 'stream-task-1',
        status: {
          state: TaskState.Working,
          message: null
        },
        final: false
      };
      const resp: SendTaskStreamingResponse = {
        jsonrpc: '2.0',
        id: 'stream-task-1',
        result: statusEvent
      };
      expect(resp.jsonrpc).toBe('2.0');
      expect(resp.id).toBe('stream-task-1');
      expect(resp.result).toBe(statusEvent);
      expect(resp.error).toBeUndefined();
    });
  });
});
