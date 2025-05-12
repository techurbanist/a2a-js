import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';

import {
  AgentCard,
  Role,
  TextPart,
  Message,
  Task,
  SendMessageRequest,
  SendMessageResponse,
  SendMessageSuccessResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingResponse,
  SendMessageStreamingSuccessResponse,
  CancelTaskRequest, 
  CancelTaskResponse, 
  TaskResubscriptionRequest,
   UnsupportedOperationError,
  JSONRPCErrorResponse
} from '../src/types';

import { A2AClient,  } from '../src/client';
import { A2AServer,  } from '../src/server';
import { AgentExecutor } from '../src/server/agent_executor';
import { DefaultA2ARequestHandler } from '../src/server/request_handler';


describe('A2A Client-Server Integration Test', () => {
  
  test('Basic test to ensure Jest is working with this file', () => {
    // This is just a simple test to make sure Jest can run this file
    expect(1 + 1).toBe(2);
    
    // Verify we can use the imported types
    const textPart: TextPart = { 
      type: 'text', 
      text: 'Test message' 
    };
    
    expect(textPart.text).toBe('Test message');
    expect(Role.User).toBe('user');
    expect(Role.Agent).toBe('agent');
  });

  /**
   * Test Hello World Agent implementation for tests
   */
  class TestHelloWorldAgent {
    /**
     * Invoke the agent
     * @returns The result
     */
    async invoke(): Promise<string> {
      return 'Hello World';
    }

    /**
     * Stream the agent response
     */
    async *stream(): AsyncGenerator<{ content: string, done: boolean }, void, unknown> {
      yield { content: 'Hello ', done: false };
      yield { content: 'World', done: false };
      yield { content: '!', done: true };
    }
  }

  /**
   * Test Agent Executor
   */
  class TestAgentExecutor implements AgentExecutor {
    private agent: TestHelloWorldAgent;

    constructor() {
      this.agent = new TestHelloWorldAgent();
    }

    /**
     * Handle message send request
     */
    async onMessageSend(
      request: SendMessageRequest,
      task?: Task
    ): Promise<SendMessageResponse> {
      const result = await this.agent.invoke();

      const message: Message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: result } as TextPart],
        messageId: uuidv4(),
      };

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: message
      };
    }

    /**
     * Handle message stream request
     */
    async *onMessageStream(
      request: SendMessageStreamingRequest,
      task?: Task
    ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
      for await (const chunk of this.agent.stream()) {
        const message: Message = {
          role: Role.Agent,
          parts: [{ type: 'text', text: chunk.content } as TextPart],
          messageId: uuidv4(),
          final: chunk.done,
        };

        const response: SendMessageStreamingResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: message
        };

        yield response;
      }
    }

    /**
     * Handle cancel request
     */
    async onCancel(
      request: CancelTaskRequest,
      task: Task
    ): Promise<CancelTaskResponse> {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: new UnsupportedOperationError()
      };
    }

    /**
     * Handle resubscribe request
     */
    async *onResubscribe(
      request: TaskResubscriptionRequest,
      task: Task
    ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
      yield {
        jsonrpc: '2.0',
        id: request.id,
        error: new UnsupportedOperationError()
      };
    }
  }

  test('End-to-end client-server communication', async () => {
    // Set up the test port - using a non-standard port to avoid conflicts
    const TEST_PORT = 9876;
    const TEST_URL = `http://localhost:${TEST_PORT}`;
    
    // Define a simple agent card for testing
    const agentCard: AgentCard = {
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
      }
    };

    // Create the request handler with our test agent executor
    const requestHandler = new DefaultA2ARequestHandler(
      new TestAgentExecutor()
    );

    // Create the server
    const server = new A2AServer(agentCard, requestHandler);
    
    // Get the Express app and create an HTTP server
    const expressApp = server.app();
    const httpServer = http.createServer(expressApp);
    
    // Start the server and wait for it to be ready
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, '0.0.0.0', () => {
        console.log(`Test server running at http://localhost:${TEST_PORT}`);
        resolve();
      });
    });
    
    try {
      // Create the Axios client
      const axiosClient = axios.create();
      
      // Create the A2A client
      const client = await A2AClient.getClientFromAgentCardUrl(
        axiosClient,
        TEST_URL
      );
      
      // Test basic message
      const basicResponse = await client.sendMessage({
        message: {
          role: Role.User,
          parts: [{ type: 'text', text: 'Hello' }],
          messageId: uuidv4()
        }
      });
      
      // Validate the basic response - need to check if it's an error or success response
      expect(basicResponse).toBeDefined();
      
      // Check if the response has a result property (success response)
      if ('result' in basicResponse) {
        const successResponse = basicResponse as SendMessageSuccessResponse;
        const resultMessage = successResponse.result as Message;
        
        expect(resultMessage.parts[0].type).toBe('text');
        expect((resultMessage.parts[0] as TextPart).text).toBe('Hello World');
      } else {
        // This is an error response, which should fail the test
        const errorResponse = basicResponse as JSONRPCErrorResponse;
        fail(`Expected success response but got error: ${JSON.stringify(errorResponse.error)}`);
      }
      
      // Test streaming message
      const streamingChunks: SendMessageStreamingResponse[] = [];
      
      await client.sendMessageStreaming(
        {
          message: {
            role: Role.User,
            parts: [{ type: 'text', text: 'Hello streaming' }],
            messageId: uuidv4()
          }
        },
        uuidv4(),
        (chunk) => {
          streamingChunks.push(chunk as SendMessageStreamingResponse);
        }
      );
      
      // Validate streaming response
      expect(streamingChunks.length).toBe(3);
      
      // Process each chunk with proper type handling
      const processedChunks = streamingChunks.map(chunk => {
        if ('result' in chunk) {
          const successChunk = chunk as SendMessageStreamingSuccessResponse;
          return successChunk.result;
        } else {
          const errorChunk = chunk as JSONRPCErrorResponse;
          fail(`Expected success response but got error: ${JSON.stringify(errorChunk.error)}`);
          return null;
        }
      }).filter(Boolean) as Message[];
      
      // Check chunk contents
      expect((processedChunks[0].parts[0] as TextPart).text).toBe('Hello ');
      expect(processedChunks[0].final).toBeFalsy();
      
      expect((processedChunks[1].parts[0] as TextPart).text).toBe('World');
      expect(processedChunks[1].final).toBeFalsy();
      
      expect((processedChunks[2].parts[0] as TextPart).text).toBe('!');
      expect(processedChunks[2].final).toBeTruthy();
      
      // Combine all chunks to validate the full message
      const fullText = processedChunks
        .map(message => ((message.parts[0] as TextPart).text))
        .join('');
      
      expect(fullText).toBe('Hello World!');
    } finally {
      // Clean up - stop the server
      await new Promise<void>((resolve) => {
        httpServer.close(() => {
          console.log('Test server closed');
          resolve();
        });
      });
    }
  }, 10000); // Increase timeout to 10 seconds for this test

});
