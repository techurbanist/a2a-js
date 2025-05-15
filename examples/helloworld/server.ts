import {
  Role as RoleEnum,
  TaskState as TaskStateEnum,
  AgentCard,
  AgentSkill,
  A2AServer,
  DefaultA2ARequestHandler,
  Message,
  Part,
  Task,
  OperationNotSupportedError,
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  TaskResubscriptionRequest,
  TaskStatusUpdateEvent
} from '../../src/index.js';

/**
 * Hello World Agent implementation
 */
class HelloWorldAgent {
  async invoke(): Promise<string> {
    return 'Hello World';
  }
  async *stream(): AsyncGenerator<{ content: string, done: boolean }, void, unknown> {
    yield { content: 'Hello ', done: false };
    await new Promise(resolve => setTimeout(resolve, 2000));
    yield { content: 'World', done: false };
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield { content: '!', done: true };
  }
}

class HelloWorldAgentExecutor {
  private agent: HelloWorldAgent;
  constructor() {
    this.agent = new HelloWorldAgent();
  }
  async onMessageSend(
    request: SendMessageRequest,
    task?: Task
  ): Promise<SendMessageResponse> {
    const result = await this.agent.invoke();
    const message: Message = {
      role: RoleEnum.Agent,
      parts: [{ type: 'text', text: result } as Part]
    };
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: message
    };
  }
  async *onMessageStream(
    request: SendMessageStreamingRequest,
    task?: Task
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    for await (const chunk of this.agent.stream()) {
      const message: Message = {
        role: RoleEnum.Agent,
        parts: [{ type: 'text', text: chunk.content } as Part]
      };
      yield {
        jsonrpc: '2.0',
        id: request.id,
        result: message
      };
    }
  }
  async onCancel(
    request: CancelTaskRequest,
    task: Task
  ): Promise<CancelTaskResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }
  async *onResubscribe(
    request: TaskResubscriptionRequest,
    task: Task
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    yield {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }
}

const skill: AgentSkill = {
  id: 'hello_world',
  name: 'Returns hello world',
  description: 'just returns hello world',
  tags: ['hello world'],
  examples: ['hi', 'hello world'],
};
const agentCard: AgentCard = {
  name: 'Hello World Agent',
  description: 'Just a hello world agent',
  url: 'http://localhost:9999/',
  version: '1.0.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: { streaming: true },
  skills: [skill],
  authentication: {
    schemes: ['public'],
  }
};
const requestHandler = new DefaultA2ARequestHandler(
  new HelloWorldAgentExecutor()
);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9999;
const server = new A2AServer(agentCard, requestHandler);
server.start({ port });
