import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import {
  Role,
  TaskState,
  Message,
  Part,
  TaskSendParams,
  SendTaskStreamingResponse,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from '../../src/index.js';

/**
 * Simple Hello World client example (A2A protocol-compliant)
 */
async function main() {
  // Create the A2A client directly (no agent card discovery helper)
  const client = new A2AClient('http://localhost:9999/', fetch);

  console.log('Testing basic request...');

  // Send a basic task (protocol-compliant)
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

  // Send a streaming task (protocol-compliant)
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
      // Skip empty events (e.g., {})
      if (!event || (typeof event === 'object' && Object.keys(event).length === 0)) {
        continue;
      }
      if ('result' in event && event.result) {
        // Discriminate event type using the 'type' field
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
          } else if (
            [TaskState.Completed, TaskState.Canceled, TaskState.Failed, TaskState.InputRequired].includes(state)
          ) {
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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
