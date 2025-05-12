import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResult,
  SendMessageRequest,
  SendMessageSuccessResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingSuccessResponse,
  GetTaskRequest,
  TaskQueryParams,
  MessageSendParams,
  TaskIdParams,
  PushNotificationConfig,
  TaskSendParams,
  TaskPushNotificationConfig,
  CancelTaskRequest,
  CancelTaskSuccessResponse,
  GetTaskSuccessResponse,
  SetTaskPushNotificationConfigRequest,
  SetTaskPushNotificationConfigSuccessResponse,
  GetTaskPushNotificationConfigRequest,
  GetTaskPushNotificationConfigSuccessResponse,
  TaskResubscriptionRequest,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  JSONRPCErrorResponse,
  Message, 
  TextPart, 
  Role, 
  Task, 
  TaskState, 
  TaskStatus,
  TaskArtifact
} from '../src/types';


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
    messageId: 'msg-789',
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
      expect(request.params.message.messageId).toBe('msg-789');
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
      if ('messageId' in response.result) {
        expect(response.result.messageId).toBe('msg-789');
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
      expect(request.params.message.messageId).toBe('msg-789');
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
      expect(response.result.messageId).toBe('msg-789');
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
      expect(params.message.messageId).toBe('msg-789');
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
        messageId: 'msg-input-cancel',
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
        messageId: 'msg-input-get',
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
      const statusEvent: TaskStatusUpdateEvent = {
        type: 'taskStatusUpdate',
        taskId: 'task-123',
        state: TaskState.Working
      };

      expect(statusEvent.type).toBe('taskStatusUpdate');
      expect(statusEvent.taskId).toBe('task-123');
      expect(statusEvent.state).toBe(TaskState.Working);
      expect(statusEvent.statusMessage).toBeUndefined();

      // With optional statusMessage
      const statusEventWithMessage: TaskStatusUpdateEvent = {
        type: 'taskStatusUpdate',
        taskId: 'task-123',
        state: TaskState.Completed,
        statusMessage: 'Task completed successfully'
      };

      expect(statusEventWithMessage.statusMessage).toBe('Task completed successfully');
    });

    test('TaskArtifactUpdateEvent should have correct format', () => {
      const artifact: TaskArtifact = {
        artifactId: 'art-123',
        mimeType: 'application/json',
        data: { result: 'example' }
      };

      const artifactEvent: TaskArtifactUpdateEvent = {
        type: 'taskArtifactUpdate',
        taskId: 'task-123',
        artifact
      };

      expect(artifactEvent.type).toBe('taskArtifactUpdate');
      expect(artifactEvent.taskId).toBe('task-123');
      expect(artifactEvent.artifact.artifactId).toBe('art-123');
      expect(artifactEvent.artifact.mimeType).toBe('application/json');
      expect(artifactEvent.artifact.data).toEqual({ result: 'example' });
    });
  });

  // Test error response format
  describe('Error Response Types', () => {
    test('JSONRPCErrorResponse should have correct format for A2A RPC methods', () => {
      const errorResponse: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid task ID'
        },
        id: 'error-resp-123'
      };

      expect(errorResponse.jsonrpc).toBe('2.0');
      expect(errorResponse.error.code).toBe(-32602);
      expect(errorResponse.error.message).toBe('Invalid task ID');
      expect(errorResponse.id).toBe('error-resp-123');

      // With optional error data
      const errorWithData: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid task ID',
          data: { taskId: 'invalid-id' }
        },
        id: 'error-data-resp-123'
      };

      expect(errorWithData.error.data).toEqual({ taskId: 'invalid-id' });
    });
  });
});
