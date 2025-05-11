import {
  AgentAuthentication,
  AgentCapabilities,
  AgentCard,
  AgentProvider,
  AgentSkill,
  JSONRPCError,
  JSONRPCErrorResponse,
  JSONRPCMessage,
  JSONRPCRequest,
  Role,
  TextPart,
  DataPart,
  FilePart,
  FileWithUri,
  FileWithBytes,
  PartBase,
  Message,
  TaskState,
  TaskArtifact,
  Task,
  SendMessageRequest,
  SendMessageSuccessResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingSuccessResponse,
  GetTaskRequest,
  TaskQueryParams,
  MessageSendParams,
  TaskIdParams,
  JSONRPCErrorCode
} from '../src/types';

describe('Basic A2A Types', () => {
  // Helper data
  const MINIMAL_AGENT_AUTH = { schemes: ['Bearer'] };
  const FULL_AGENT_AUTH = {
    schemes: ['Bearer', 'Basic'],
    credentials: 'user:pass',
  };

  const MINIMAL_AGENT_SKILL = {
    id: 'skill-123',
    name: 'Recipe Finder',
    description: 'Finds recipes',
    tags: ['cooking'],
  };

  const MINIMAL_AGENT_CARD = {
    authentication: MINIMAL_AGENT_AUTH,
    capabilities: {},
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json'],
    description: 'Test Agent',
    name: 'TestAgent',
    skills: [MINIMAL_AGENT_SKILL],
    url: 'http://example.com/agent',
    version: '1.0',
  };

  // Test JSON-RPC base types
  describe('JSONRPC Types', () => {
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

    test('JSON-RPC Error Response should include error object', () => {
      const errorObj: JSONRPCError = { 
        code: -32600, 
        message: 'Invalid Request'
      };
      
      const errorResponse: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        error: errorObj,
        id: 'err-1'
      };
      
      expect(errorResponse.error.code).toBe(-32600);
      expect(errorResponse.error.message).toBe('Invalid Request');
    });
  });

  // Test Agent types
  describe('Agent Types', () => {
    test('AgentAuthentication should have schemes', () => {
      const auth: AgentAuthentication = MINIMAL_AGENT_AUTH;
      expect(auth.schemes).toEqual(['Bearer']);
      expect(auth.credentials).toBeUndefined();

      const authFull: AgentAuthentication = FULL_AGENT_AUTH;
      expect(authFull.schemes).toEqual(['Bearer', 'Basic']);
      expect(authFull.credentials).toBe('user:pass');
    });

    test('AgentCapabilities should handle optional fields', () => {
      const caps: AgentCapabilities = {
        streaming: undefined,
        stateTransitionHistory: undefined,
        pushNotifications: undefined
      };
      expect(caps.pushNotifications).toBeUndefined();

      const capsFull: AgentCapabilities = {
        pushNotifications: true,
        stateTransitionHistory: false,
        streaming: true
      };
      expect(capsFull.pushNotifications).toBe(true);
      expect(capsFull.stateTransitionHistory).toBe(false);
      expect(capsFull.streaming).toBe(true);
    });

    test('AgentProvider should have organization and url', () => {
      const provider: AgentProvider = {
        organization: 'Test Org',
        url: 'http://test.org'
      };
      expect(provider.organization).toBe('Test Org');
      expect(provider.url).toBe('http://test.org');
    });

    test('AgentSkill should have required fields', () => {
      const skill: AgentSkill = MINIMAL_AGENT_SKILL;
      expect(skill.id).toBe('skill-123');
      expect(skill.name).toBe('Recipe Finder');
      expect(skill.description).toBe('Finds recipes');
      expect(skill.tags).toEqual(['cooking']);
      expect(skill.examples).toBeUndefined();
    });

    test('AgentCard should have all required fields', () => {
      const card: AgentCard = MINIMAL_AGENT_CARD;
      expect(card.name).toBe('TestAgent');
      expect(card.version).toBe('1.0');
      expect(card.authentication.schemes).toEqual(['Bearer']);
      expect(card.skills.length).toBe(1);
      expect(card.skills[0].id).toBe('skill-123');
      expect(card.provider).toBeUndefined();
    });
  });

  // Test Roles enum
  describe('Role Enum', () => {
    test('should have User and Agent roles', () => {
      expect(Role.User).toBe('user');
      expect(Role.Agent).toBe('agent');
    });
  });

  // Test Message Part types
  describe('Message Part Types', () => {
    test('TextPart should have text content', () => {
      const textPart: TextPart = {
        type: 'text',
        text: 'Hello, world!'
      };
      expect(textPart.type).toBe('text');
      expect(textPart.text).toBe('Hello, world!');
      expect(textPart.metadata).toBeUndefined();

      const textPartWithMetadata: TextPart = {
        type: 'text',
        text: 'Hello with metadata',
        metadata: { timestamp: 'now' }
      };
      expect(textPartWithMetadata.metadata?.timestamp).toBe('now');
    });

    test('DataPart should have data content', () => {
      const dataPart: DataPart = {
        type: 'data',
        data: { key: 'value', nested: { foo: 'bar' } }
      };
      expect(dataPart.type).toBe('data');
      expect(dataPart.data.key).toBe('value');
      expect(dataPart.data.nested.foo).toBe('bar');
    });

    test('FilePart with URI should handle file references', () => {
      const fileUri: FileWithUri = {
        uri: 'file:///path/to/file.txt',
        mimeType: 'text/plain',
        name: 'sample.txt'
      };
      
      const filePart: FilePart = {
        type: 'file',
        file: fileUri
      };
      
      expect(filePart.type).toBe('file');
      
      // Since file is a union type, we need to check the property first
      if ('uri' in filePart.file) {
        expect(filePart.file.uri).toBe('file:///path/to/file.txt');
        expect(filePart.file.mimeType).toBe('text/plain');
      }
    });

    test('FilePart with bytes should handle file content', () => {
      const fileBytes: FileWithBytes = {
        bytes: 'aGVsbG8=', // base64 for "hello"
        name: 'hello.txt',
        mimeType: 'text/plain'
      };
      
      const filePart: FilePart = {
        type: 'file',
        file: fileBytes
      };
      
      expect(filePart.type).toBe('file');
      
      // Since file is a union type, we need to check the property first
      if ('bytes' in filePart.file) {
        expect(filePart.file.bytes).toBe('aGVsbG8=');
        expect(filePart.file.name).toBe('hello.txt');
      }
    });
  });

  // Test Message types
  describe('Message Types', () => {
    test('Message should have required fields', () => {
      const textPart: TextPart = {
        type: 'text',
        text: 'Hello, world!'
      };

      const message: Message = {
        messageId: 'msg-123',
        role: Role.User,
        parts: [textPart]
      };

      expect(message.messageId).toBe('msg-123');
      expect(message.role).toBe(Role.User);
      expect(message.parts.length).toBe(1);
      expect(message.parts[0].type).toBe('text');
      expect((message.parts[0] as TextPart).text).toBe('Hello, world!');
    });

    test('Message can contain multiple part types', () => {
      const textPart: TextPart = {
        type: 'text',
        text: 'Message with multiple parts'
      };

      const dataPart: DataPart = {
        type: 'data',
        data: { status: 'success' }
      };

      const fileUri: FileWithUri = {
        uri: 'file:///path/to/file.txt',
        mimeType: 'text/plain'
      };

      const filePart: FilePart = {
        type: 'file',
        file: fileUri
      };

      const message: Message = {
        messageId: 'msg-456',
        role: Role.Agent,
        parts: [textPart, dataPart, filePart],
        taskId: 'task-123',
        final: true
      };

      expect(message.parts.length).toBe(3);
      expect(message.parts[0].type).toBe('text');
      expect(message.parts[1].type).toBe('data');
      expect(message.parts[2].type).toBe('file');
      expect(message.taskId).toBe('task-123');
      expect(message.final).toBe(true);
    });
  });

  // Test Task types
  describe('Task State', () => {
    test('TaskState enum should have correct values', () => {
      expect(TaskState.Active).toBe('active');
      expect(TaskState.Completed).toBe('completed');
      expect(TaskState.Failed).toBe('failed');
      expect(TaskState.Canceled).toBe('canceled');
    });
  });

  describe('TaskArtifact', () => {
    test('TaskArtifact should have required fields', () => {
      const artifact: TaskArtifact = {
        artifactId: 'artifact-123',
        mimeType: 'application/json',
        uri: 'http://example.com/artifacts/123'
      };

      expect(artifact.artifactId).toBe('artifact-123');
      expect(artifact.mimeType).toBe('application/json');
      expect(artifact.uri).toBe('http://example.com/artifacts/123');
    });
  });

  // Test Request/Response types
  describe('Request and Response Types', () => {
    const textPart: TextPart = {
      type: 'text',
      text: 'Hello from request'
    };

    const message: Message = {
      messageId: 'msg-789',
      role: Role.User,
      parts: [textPart]
    };

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
  });

  // Test Error types
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
  });
});
