import { v4 as uuidv4 } from 'uuid';

import { 
  AgentAuthentication,
  AgentCapabilities,
  AgentCard,
  AgentExecutor,
  AgentSkill,
  A2AServer,
  CancelTaskRequest,
  CancelTaskResponse,
  DefaultA2ARequestHandler,
  Message,
  Part,
  Role,
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingResponse,
  SendMessageStreamingSuccessResponse,
  SendMessageSuccessResponse,
  Task,
  TaskResubscriptionRequest,
  UnsupportedOperationError
} from '../../src/index.js';

/**
 * Hello World Agent implementation
 */
class HelloWorldAgent {
  /**
   * Invoke the agent
   * @returns The result
   */
  async invoke(): Promise<string> {
    return 'Hello World';
  }

  /**
   * Stream the agent response
   * @returns The generator
   */
  async *stream(): AsyncGenerator<{ content: string, done: boolean }, void, unknown> {
    console.log('Starting stream generator');
    yield { content: 'Hello ', done: false };
    
    console.log('First chunk sent, waiting 2 seconds...');
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Sending second chunk');
    yield { content: 'World', done: false };
    
    console.log('Waiting 1 second before final chunk...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Sending final chunk');
    yield { content: '!', done: true };
  }
}

/**
 * Hello World Agent Executor
 */
class HelloWorldAgentExecutor implements AgentExecutor {
  private agent: HelloWorldAgent;

  constructor() {
    this.agent = new HelloWorldAgent();
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
      parts: [{ type: 'text', text: result } as Part],
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
    console.log('Starting streaming response...');
    
    for await (const chunk of this.agent.stream()) {
      console.log('Sending chunk:', chunk);
      
      const message: Message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: chunk.content } as Part],
        messageId: uuidv4(),
        final: chunk.done,
      };

      const response: SendMessageStreamingResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: message
      };

      console.log('Yielding response:', JSON.stringify(response));
      yield response;
    }
    
    console.log('Streaming complete');
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
      error: UnsupportedOperationError
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
      error: UnsupportedOperationError
    };
  }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Define the agent skill
  const skill: AgentSkill = {
    id: 'hello_world',
    name: 'Returns hello world',
    description: 'just returns hello world',
    tags: ['hello world'],
    examples: ['hi', 'hello world'],
  };

  // Create the agent card
  const agentCard: AgentCard = {
    name: 'Hello World Agent',
    description: 'Just a hello world agent',
    url: 'http://localhost:9999/',
    version: '1.0.0',
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    capabilities: {},
    skills: [skill],
    authentication: {
      schemes: ['public'],
    }
  };

  // Create the request handler
  const requestHandler = new DefaultA2ARequestHandler(
    new HelloWorldAgentExecutor()
  );

  // Create and start the server
  const server = new A2AServer(agentCard, requestHandler);
  server.start({ port: 9999 });
}
