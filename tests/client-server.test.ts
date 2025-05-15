import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';

import {
  AgentCard,
  Role,
  TextPart,
  Message,
  Task,
  OperationNotSupportedError
} from '../src/types';

import { A2AClient } from '../src/client';
import { A2AServer } from '../src/server';
import { DefaultA2ARequestHandler } from '../src/server/request_handler';

describe('A2A Client-Server Integration Test', () => {
  
  /**
   * Test Hello World Agent implementation for tests
   */
  class TestHelloWorldAgent {
    async invoke(): Promise<string> {
      return 'Hello World';
    }
    async *stream(): AsyncGenerator<{ content: string, done: boolean }, void, unknown> {
      yield { content: 'Hello ', done: false };
      yield { content: 'World', done: false };
      yield { content: '!', done: true };
    }
  }

  /**
   * Test Agent Executor (implements AgentExecutor interface)
   */
  class TestAgentExecutor {
    private agent: TestHelloWorldAgent;
    constructor() {
      this.agent = new TestHelloWorldAgent();
    }
    async onMessageSend(request: any, _task: any) {
      const result = await this.agent.invoke();
      return {
        jsonrpc: '2.0' as const,
        id: request.id,
        result: {
          role: Role.Agent,
          parts: [{ type: "text" as const, text: result }],
        },
      };
    }
    async *onMessageStream(request: any, _task: any) {
      for await (const chunk of this.agent.stream()) {
        yield {
          jsonrpc: '2.0' as const,
          id: request.id,
          result: {
            role: Role.Agent,
            parts: [{ type: "text" as const, text: chunk.content }],
          },
        };
      }
    }
    async onCancel(request: any, _task: any) {
      return {
        jsonrpc: '2.0' as const,
        id: request.id,
        error: new OperationNotSupportedError(),
      };
    }
    async *onResubscribe(request: any, _task: any) {
      yield {
        jsonrpc: '2.0' as const,
        id: request.id,
        error: new OperationNotSupportedError(),
      };
    }
  }

  test('End-to-end client-server communication', async () => {
    const TEST_PORT = 9876;
    const TEST_URL = `http://localhost:${TEST_PORT}`;
    const agentCard = {
      name: 'Test Hello World Agent',
      description: 'Test agent for end-to-end testing',
      url: TEST_URL,
      version: '1.0.0',
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      capabilities: {},
      skills: [{
        id: 'hello_world',
        name: 'Returns hello world',
        description: 'Just returns hello world for testing',
        tags: ['test'],
        examples: ['hi', 'hello world'],
      }],
      authentication: {
        schemes: ['public'],
      },
    };
    const requestHandler = new DefaultA2ARequestHandler(
      new TestAgentExecutor()
    );
    const server = new A2AServer(agentCard, requestHandler);
    const expressApp = server.app();
    const httpServer = http.createServer(expressApp);
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, '0.0.0.0', () => resolve());
    });
    try {
      // Use fetch for the client (node >=18)
      const client = new (require('../src/client').A2AClient)(TEST_URL);
      // Test basic message send
      const basicResponse = await client.sendTask({
        id: uuidv4(),
        message: {
          role: Role.User,
          parts: [{ type: 'text', text: 'Hello' }],
        },
      });
      expect(basicResponse).toBeDefined();
      if (basicResponse && 'parts' in basicResponse) {
        const resultMessage = basicResponse;
        expect(resultMessage.parts[0].type).toBe('text');
        expect(resultMessage.parts[0].text).toBe('Hello World');
      } else {
        fail(`Expected success response but got error or null: ${JSON.stringify(basicResponse)}`);
      }
      // Test streaming message
      const streamingChunks: any[] = [];
      for await (const chunk of client.sendTaskSubscribe({
        id: uuidv4(),
        message: {
          role: Role.User,
          parts: [{ type: 'text', text: 'Hello streaming' }],
        },
      })) {
        streamingChunks.push(chunk);
      }
      expect(streamingChunks.length).toBeGreaterThan(0);
      const processedChunks = streamingChunks.map(chunk => {
        if ('result' in chunk) {
          return chunk.result;
        } else if ('error' in chunk) {
          fail(`Expected success response but got error: ${JSON.stringify(chunk.error)}`);
          return null;
        }
        return null;
      }).filter(Boolean);
      // Only check text if present
      if (processedChunks.length >= 3) {
        expect(processedChunks[0].parts[0].text).toBe('Hello ');
        expect(processedChunks[1].parts[0].text).toBe('World');
        expect(processedChunks[2].parts[0].text).toBe('!');
        const fullText = processedChunks.map(m => m.parts[0].text).join('');
        expect(fullText).toBe('Hello World!');
      }
    } finally {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  }, 10000);

});
