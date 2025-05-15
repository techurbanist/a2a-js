import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams, SendTaskStreamingResponse, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, TaskState, Part } from '../../src/index.js';

/**
 * Streaming Task Execution (SSE)
 * Client asks for a story, agent streams the story incrementally.
 */
async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const params: TaskSendParams = {
    id: uuidv4(),
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'Write a very short story about a curious robot exploring Mars.' }],
    },
  };
  const stream = client.sendTaskSubscribe(params);
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
