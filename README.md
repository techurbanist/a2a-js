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
npm install a2a-js uuid axios
```

```javascript
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { A2AClient, Role } from 'a2a-js';

async function main() {
  const axiosClient = axios.create();
  
  // Create the A2A client
  const client = await A2AClient.getClientFromAgentCardUrl(
    axiosClient,
    'http://localhost:3000'
  );

  // Send a basic message
  const basicResponse = await client.sendMessage({
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'Hello agent' }],
      messageId: uuidv4()
    }
  });
  
  // Process the response
  if ('result' in basicResponse) {
    const successResponse = basicResponse;
    const resultMessage = successResponse.result;
    
    console.log('Response:', JSON.stringify(resultMessage, null, 2));
    
    // Extract text parts
    const textContent = resultMessage.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
    
    console.log('Message content:', textContent);
  } else {
    // Handle error response
    console.error('Error:', basicResponse.error);
  }
  
  // Send a streaming message
  try {
    const streamingChunks = [];
    
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
        if ('result' in chunk) {
          // Handle success chunks
          const message = chunk.result;
          streamingChunks.push(message);
          
          // Extract text from the message
          if (message.parts && message.parts[0].type === 'text') {
            const text = message.parts[0].text;
            process.stdout.write(text); // Print without newline
            
            // Print newline on final chunk
            if (message.final) {
              process.stdout.write('\n');
            }
          }
        } else {
          // Handle error chunks
          console.error('Stream error:', chunk.error);
        }
      }
    );
    
    // Combine all chunks to get the complete message
    const fullText = streamingChunks
      .map(message => message.parts[0].type === 'text' ? message.parts[0].text : '')
      .join('');
    
    console.log('\nFull message:', fullText);
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

main().catch(error => console.error('Error:', error));
```

### Server Example

```javascript
import { v4 as uuidv4 } from 'uuid';
import { 
  A2AServer, 
  DefaultA2ARequestHandler,
  Role,
  UnsupportedOperationError
} from 'a2a-js';

/**
 * Simple agent implementation
 */
class HelloWorldAgent {
  /**
   * Standard synchronous response
   */
  async invoke() {
    return 'Hello World';
  }

  /**
   * Stream the response in multiple chunks
   */
  async *stream() {
    yield { content: 'Hello ', done: false };
    yield { content: 'World', done: false };
    yield { content: '!', done: true };
  }
}

/**
 * Agent executor implementation
 */
class MyAgentExecutor {
  constructor() {
    this.agent = new HelloWorldAgent();
  }

  /**
   * Handle standard message request
   */
  async onMessageSend(request, task) {
    const result = await this.agent.invoke();
    
    const message = {
      role: Role.Agent,
      parts: [{ type: 'text', text: result }],
      messageId: uuidv4(),
    };

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: message
    };
  }

  /**
   * Handle streaming message request
   */
  async *onMessageStream(request, task) {
    for await (const chunk of this.agent.stream()) {
      const message = {
        role: Role.Agent,
        parts: [{ type: 'text', text: chunk.content }],
        messageId: uuidv4(),
        final: chunk.done,
      };

      yield {
        jsonrpc: '2.0',
        id: request.id,
        result: message
      };
    }
  }

  /**
   * Handle task cancellation
   */
  async onCancel(request, task) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: UnsupportedOperationError
    };
  }

  /**
   * Handle task resubscription
   */
  async *onResubscribe(request, task) {
    yield {
      jsonrpc: '2.0',
      id: request.id,
      error: UnsupportedOperationError
    };
  }
}

// Define the agent card
const agentCard = {
  name: 'Hello World Agent',
  description: 'A simple A2A agent example',
  url: 'http://localhost:3000',
  version: '1.0.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: {},
  skills: [{
    id: 'hello_world',
    name: 'Hello World',
    description: 'Responds with Hello World',
    tags: ['example'],
    examples: ['hello', 'hi'],
  }],
  authentication: {
    schemes: ['public']
  }
};

// Set up the server
const PORT = 3000;

// Create the request handler with our agent executor
const requestHandler = new DefaultA2ARequestHandler(new MyAgentExecutor());

// Create the server
const server = new A2AServer(agentCard, requestHandler);

// Start the server
try {
  server.start({ port: PORT, host: '0.0.0.0' });
  console.log(`A2A server running at http://localhost:${PORT}`);
} catch (error) {
  console.error('Failed to start server:', error);
}
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
