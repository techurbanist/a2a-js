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

```typescript
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { A2AClient, Role } from 'a2a-js';

async function main() {
  const axiosClient = axios.create();
  
  // Create the A2A client
  const client = await A2AClient.getClientFromAgentCardUrl(
    axiosClient,
    'http://localhost:9999'
  );

  // Send a basic message
  const response = await client.sendMessage({
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'Hello agent' }],
      messageId: uuidv4()
    }
  });
  
  console.log('Response:', JSON.stringify(response, null, 2));
  
  // Send a streaming message
  try {
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
        console.log('Stream Chunk:', JSON.stringify(chunk, null, 2));
        
        // Extract and print text content from the response
        if (chunk && 'result' in chunk && chunk.result && 'parts' in chunk.result) {
          const textParts = chunk.result.parts
            .filter(part => part.type === 'text')
            .map(part => (part as any).text)
            .join('');
          
          if (textParts) {
            console.log('Message content:', textParts);
          }
        }
      }
    );
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

main().catch(error => console.error('Error:', error));
```

### Server Example

```typescript
import { v4 as uuidv4 } from 'uuid';
import { 
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
  Task,
  TaskResubscriptionRequest,
  UnsupportedOperationError
} from 'a2a-js';

/**
 * Simple agent implementation
 */
class MyAgent {
  async invoke(): Promise<string> {
    return 'Hello from agent';
  }

  async *stream(): AsyncGenerator<{ content: string, done: boolean }, void, unknown> {
    yield { content: 'Hello ', done: false };
    yield { content: 'from ', done: false };
    yield { content: 'agent!', done: true };
  }
}

/**
 * Agent executor implementation
 */
class MyAgentExecutor implements AgentExecutor {
  private agent = new MyAgent();

  // Handle standard message request
  async onMessageSend(
    request: SendMessageRequest,
    task?: Task
  ): Promise<SendMessageResponse> {
    const result = await this.agent.invoke();

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        role: Role.Agent,
        parts: [{ type: 'text', text: result } as Part],
        messageId: uuidv4(),
      }
    };
  }

  // Handle streaming message request
  async *onMessageStream(
    request: SendMessageStreamingRequest,
    task?: Task
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown> {
    for await (const chunk of this.agent.stream()) {
      yield {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          role: Role.Agent,
          parts: [{ type: 'text', text: chunk.content } as Part],
          messageId: uuidv4(),
          final: chunk.done,
        }
      };
    }
  }

  // Handle task cancellation
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

  // Handle task resubscription
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

// Define the agent skill
const skill: AgentSkill = {
  id: 'example_skill',
  name: 'Example Skill',
  description: 'An example skill',
  tags: ['example'],
  examples: ['hello', 'help'],
};

// Create the agent card
const agentCard: AgentCard = {
  name: 'My Agent',
  description: 'An example A2A agent',
  url: 'http://localhost:3000/',
  version: '1.0.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: {},
  skills: [skill],
  authentication: {
    schemes: ['public']
  }
};

// Create and start the server
const requestHandler = new DefaultA2ARequestHandler(new MyAgentExecutor());
const server = new A2AServer(agentCard, requestHandler);
server.start({ port: 3000 });
```

## Examples

Check the `examples/` directory for more usage examples:
- Basic client-server communication (see `examples/helloworld/client.ts` and `examples/helloworld/server.ts`)
- Streaming responses (demonstrated in the helloworld examples)

The SDK also supports long-running tasks using the task management system defined in `src/server/task_store.ts`.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
