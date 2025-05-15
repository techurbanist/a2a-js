import {
  Task,
  TaskState,
  TaskStatus,
  Message,
  TextPart,
  DataPart,
  FilePart,
  FileContent,
  Role,
  Artifact,
  PushNotificationConfig
} from '../../src/types/protocol_objects';

describe('Protocol Data Objects Types', () => {
  // Test Role values
  describe('Message Roles', () => {
    test('should correctly identify user and agent roles', () => {
      const userMessage: Message = {
        role: Role.User,
        parts: [{ type: 'text', text: 'Hello' }]
      };
      const agentMessage: Message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: 'Hello, how can I help?' }]
      };
      
      expect(userMessage.role).toBe(Role.User);
      expect(agentMessage.role).toBe(Role.Agent);
    });
  });

  // Test TaskState enum
  describe('TaskState Enum', () => {
    test('should have the correct state values according to spec', () => {
      expect(TaskState.Submitted).toBe('submitted');
      expect(TaskState.Working).toBe('working');
      expect(TaskState.InputRequired).toBe('input-required');
      expect(TaskState.Completed).toBe('completed');
      expect(TaskState.Canceled).toBe('canceled');
      expect(TaskState.Failed).toBe('failed');
      expect(TaskState.Unknown).toBe('unknown');
    });
  });

  // Test TaskStatus object
  describe('TaskStatus Object', () => {
    test('should have the required fields', () => {
      const taskStatus: TaskStatus = {
        state: TaskState.Working,
        message: {
          role: Role.Agent,
          parts: [{ type: 'text', text: 'I am working on your request' }]
        }
      };
      
      expect(taskStatus.state).toBe(TaskState.Working);
      expect(taskStatus.message?.role).toBe(Role.Agent);
      
      // With timestamp
      const statusWithTimestamp: TaskStatus = {
        state: TaskState.Completed,
        timestamp: '2025-05-11T12:00:00Z'
      };
      
      expect(statusWithTimestamp.timestamp).toBe('2025-05-11T12:00:00Z');
    });
  });

  // Test Message and Part types
  describe('Message and Part Types', () => {
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
      if (!Array.isArray(dataPart.data)) {
        expect(dataPart.data['key']).toBe('value');
        expect((dataPart.data as any).nested.foo).toBe('bar');
      }
    });

    test('FilePart should properly handle file content', () => {
      // File with URI
      const fileContentWithUri: FileContent = {
        name: 'sample.txt',
        mimeType: 'text/plain',
        uri: 'https://example.com/file.txt'
      };
      
      const filePartWithUri: FilePart = {
        type: 'file',
        file: fileContentWithUri
      };
      
      expect(filePartWithUri.type).toBe('file');
      expect(filePartWithUri.file.name).toBe('sample.txt');
      expect(filePartWithUri.file.uri).toBe('https://example.com/file.txt');
      
      // File with bytes
      const fileContentWithBytes: FileContent = {
        name: 'hello.txt',
        mimeType: 'text/plain',
        bytes: 'aGVsbG8=' // base64 for "hello"
      };
      
      const filePartWithBytes: FilePart = {
        type: 'file',
        file: fileContentWithBytes
      };
      
      expect(filePartWithBytes.file.bytes).toBe('aGVsbG8=');
      expect(filePartWithBytes.file.name).toBe('hello.txt');
      
      // Either uri or bytes must be present, but not both
      expect(!!fileContentWithUri.uri || !!fileContentWithUri.bytes).toBeTruthy();
      expect(!!fileContentWithBytes.uri || !!fileContentWithBytes.bytes).toBeTruthy();
    });

    test('Message should have required fields', () => {
      const message: Message = {
        role: Role.User,
        parts: [
          { type: 'text', text: 'Hello, agent!' }
        ]
      };

      expect(message.role).toBe(Role.User);
      expect(message.parts.length).toBe(1);
      expect(message.parts[0].type).toBe('text');
      
      // Message with optional metadata
      const messageWithMetadata: Message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: 'Hello!' }],
        metadata: { sourceSystem: 'test' }
      };
      
      expect(messageWithMetadata.metadata?.sourceSystem).toBe('test');
    });

    test('Message can contain multiple part types', () => {
      const multiPartMessage: Message = {
        role: Role.Agent,
        parts: [
          {
            type: 'text',
            text: 'Here is the requested information'
          },
          {
            type: 'data',
            data: { result: { status: 'success', code: 200 } }
          },
          {
            type: 'file',
            file: {
              name: 'results.pdf',
              mimeType: 'application/pdf',
              uri: 'https://example.com/results.pdf'
            }
          }
        ]
      };

      expect(multiPartMessage.parts.length).toBe(3);
      expect(multiPartMessage.parts[0].type).toBe('text');
      expect(multiPartMessage.parts[1].type).toBe('data');
      expect(multiPartMessage.parts[2].type).toBe('file');
    });
  });

  // Test Artifact
  describe('Artifact Object', () => {
    test('should have required parts field', () => {
      const simpleArtifact: Artifact = {
        parts: [{ type: 'text', text: 'Artifact content' }]
      };
      
      expect(simpleArtifact.parts.length).toBe(1);
      expect(simpleArtifact.parts[0].type).toBe('text');
    });
    
    test('should support optional fields', () => {
      const completeArtifact: Artifact = {
        name: 'Analysis Report',
        description: 'Detailed analysis of the data',
        parts: [
          { type: 'text', text: 'Report summary' },
          { 
            type: 'file',
            file: {
              name: 'full-report.pdf',
              mimeType: 'application/pdf',
              uri: 'https://example.com/reports/123.pdf'
            }
          }
        ],
        index: 0,
        append: false,
        lastChunk: true,
        metadata: { generatedBy: 'analyst-model', version: '2.0' }
      };
      
      expect(completeArtifact.name).toBe('Analysis Report');
      expect(completeArtifact.description).toBe('Detailed analysis of the data');
      expect(completeArtifact.index).toBe(0);
      expect(completeArtifact.append).toBe(false);
      expect(completeArtifact.lastChunk).toBe(true);
      expect(completeArtifact.metadata?.generatedBy).toBe('analyst-model');
    });
  });

  // Test Task and related objects
  describe('Task Object', () => {
    test('Task should have all required fields', () => {
      const taskStatus: TaskStatus = {
        state: TaskState.Working,
        message: {
          role: Role.Agent,
          parts: [{ type: 'text', text: 'Processing your request' }]
        },
        timestamp: '2025-05-11T10:05:00Z'
      };
      
      const task: Task = {
        id: 'task-123',
        status: taskStatus
      };

      expect(task.id).toBe('task-123');
      expect(task.status.state).toBe(TaskState.Working);
      expect(task.status.timestamp).toBe('2025-05-11T10:05:00Z');
    });

    test('Task can include optional fields', () => {
      const artifactWithParts: Artifact = {
        name: 'Result Document',
        parts: [
          { 
            type: 'file', 
            file: {
              name: 'result.pdf',
              mimeType: 'application/pdf',
              uri: 'https://example.com/result.pdf'
            }
          }
        ]
      };
      
      const userMessage: Message = {
        role: Role.User,
        parts: [{ type: 'text', text: 'Generate a report' }]
      };
      
      const agentMessage: Message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: 'Here is your report' }]
      };

      const task: Task = {
        id: 'task-456',
        sessionId: 'session-abc',
        status: {
          state: TaskState.Completed,
          message: agentMessage,
          timestamp: '2025-05-11T11:10:00Z'
        },
        artifacts: [artifactWithParts],
        history: [userMessage, agentMessage],
        metadata: { priority: 'high', customer: 'acme-corp' }
      };

      expect(task.id).toBe('task-456');
      expect(task.sessionId).toBe('session-abc');
      expect(task.status.state).toBe(TaskState.Completed);
      expect(task.artifacts?.length).toBe(1);
      expect(task.history?.length).toBe(2);
      expect(task.metadata?.priority).toBe('high');
      expect(task.metadata?.customer).toBe('acme-corp');
    });
  });
  
  // Test PushNotificationConfig
  describe('PushNotificationConfig Object', () => {
    test('should have required url field', () => {
      const config: PushNotificationConfig = {
        url: 'https://example.com/webhook'
      };
      
      expect(config.url).toBe('https://example.com/webhook');
    });
    
    test('can include optional fields', () => {
      const configWithAuth: PushNotificationConfig = {
        url: 'https://example.com/webhook',
        token: 'secret-token-123',
        authentication: {
          schemes: ['Bearer'],
          credentials: JSON.stringify({ token: 'auth-token-xyz' })
        }
      };
      
      expect(configWithAuth.token).toBe('secret-token-123');
      expect(configWithAuth.authentication?.schemes).toContain('Bearer');
      expect(typeof configWithAuth.authentication?.credentials).toBe('string');
    });
  });
});
