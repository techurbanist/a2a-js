# Agent2Agent (A2A) JavaScript SDK

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

This is a JavaScript SDK for the Agent2Agent (A2A) protocol, based on the [A2A Python SDK](https://github.com/google/A2A).

- ℹ️ Visit the official [A2A Protocol Repository](https://google.github.io/A2A/) for more information.
- 📚 **Explore the Documentation:** Visit the [Agent2Agent Protocol Documentation Site](https://google.github.io/A2A/) for a complete overview, the full protocol specification, tutorials, and guides.
- 📝 **View the Specification:** [A2A Protocol Specification](https://google.github.io/A2A/specification/)

## Overview

The Agent2Agent (A2A) protocol addresses a critical challenge in the AI landscape: enabling gen AI agents, built on diverse frameworks by different companies running on separate servers, to communicate and collaborate effectively - as agents, not just as tools.

With A2A, agents can:

- **Discover** each other's capabilities
- **Negotiate** interaction modalities (text, forms, media)
- **Securely collaborate** on long-running tasks
- **Operate without exposing** their internal state, memory, or tools

## Features

- Full implementation of the A2A protocol
- Support for both client and server applications
- TypeScript support
- Server-sent events for streaming responses
- Task management
- JSON-RPC 2.0 over HTTP(S)
- Agent discovery via Agent Cards
- Rich data exchange (text, files, structured data)

## Installation

```bash
npm install a2a-js
```

## Quick Start

### Client Example

```bash
npm install a2a-js uuid
```

```typescript
import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from 'a2a-js';
import { Role, TaskState, Part, TaskSendParams, SendTaskStreamingResponse, TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from 'a2a-js';

async function main() {
  // Create the A2A client directly
  const client = new A2AClient('http://localhost:9999/', fetch);

  console.log('Testing basic request...');
  try {
    const params: TaskSendParams = {
      id: uuidv4(),
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'Hello' }],
      },
    };
    const basicResponse = await client.sendTask(params);
    console.log('Basic Response:', JSON.stringify(basicResponse, null, 2));
  } catch (error) {
    console.error('Basic request error:', error);
  }

  console.log('\nTesting streaming request...');
  try {
    const streamParams: TaskSendParams = {
      id: uuidv4(),
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'Hello streaming' }],
      },
    };
    const stream = client.sendTaskSubscribe(streamParams);
    for await (const event of stream as AsyncGenerator<SendTaskStreamingResponse, void, unknown>) {
      if (!event || (typeof event === 'object' && Object.keys(event).length === 0)) continue;
      if ('result' in event && event.result) {
        const result = event.result;
        if (result.type === 'taskStatusUpdate') {
          const statusEvent = result as TaskStatusUpdateEvent;
          const state = statusEvent.status.state;
          const message = statusEvent.status.message;
          if (state === TaskState.Working && message && message.parts) {
            const textParts = message.parts
              .filter((part) => part.type === 'text')
              .map((part) => (part as Part & { text: string }).text)
              .join('');
            if (textParts) {
              console.log('Message content:', textParts);
            }
          } else if ([TaskState.Completed, TaskState.Canceled, TaskState.Failed, TaskState.InputRequired].includes(state)) {
            console.log('Task completed:', JSON.stringify(statusEvent, null, 2));
          }
        } else if (result.type === 'taskArtifactUpdate') {
          const artifactEvent = result as TaskArtifactUpdateEvent;
          console.log('Artifact event:', JSON.stringify(artifactEvent, null, 2));
        } else {
          console.log('Stream Event:', JSON.stringify(result, null, 2));
        }
      } else if ('error' in event && event.error) {
        console.error('Stream error:', JSON.stringify(event.error, null, 2));
      } else {
        console.log('Unknown stream event:', JSON.stringify(event, null, 2));
      }
    }
    console.log('Streaming complete');
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
```

### Server Example

```typescript
import {
  Role as RoleEnum,
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
  TaskResubscriptionRequest
} from 'a2a-js';

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
```

## Examples

Check the `examples/` directory for more usage examples:
- Basic client-server communication (see `examples/helloworld/client.ts` and `examples/helloworld/server.ts`)
- Streaming responses (demonstrated in the helloworld examples)
- **Common A2A workflows** (see `examples/common-workflows/`):
  - Basic task execution (synchronous/polling)
  - Streaming task execution (SSE)
  - Multi-turn interaction (input required)
  - Push notification setup and usage
  - File exchange (upload/download)
  - Structured data exchange (requesting/providing JSON)

The SDK also supports long-running tasks using the task management system defined in `src/server/task_store.ts`.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
