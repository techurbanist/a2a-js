import { v4 as uuidv4 } from 'uuid';
import { ScenariosAgentExecutor, InMemoryA2AClient } from './test-helpers.js';
import { Role, TextPart, TaskState, SendTaskStreamingResponse, TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from '../../src/types/index.js';

describe('9.2. Streaming Task Execution (SSE)', () => {
  let scenariosExecutor: ScenariosAgentExecutor;
  let client: InMemoryA2AClient;

  beforeEach(() => {
    scenariosExecutor = new ScenariosAgentExecutor();
    client = new InMemoryA2AClient(scenariosExecutor);
  });

  test('Should handle text streaming in chunks', async () => {
    scenariosExecutor.configure({ workingState: true }); // Ensure multiple status chunks
    const taskId = `task-story-${uuidv4()}`;
    const streamingChunks: SendTaskStreamingResponse[] = [];
    for await (const chunk of client.sendTaskSubscribe({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{ 
          type: 'text', 
          text: 'Write a very short story about a curious robot exploring Mars.' 
        }]
      }
    })) {
      streamingChunks.push(chunk);
    }
    expect(streamingChunks.length).toBeGreaterThan(2);
    const statusChunks = streamingChunks.filter(
      (chunk): chunk is SendTaskStreamingResponse & { result: TaskStatusUpdateEvent } =>
        !!chunk.result && (chunk.result as any).type === 'taskStatusUpdate'
    );
    const textContent = statusChunks
      .map(chunk => {
        const msg = (chunk.result as TaskStatusUpdateEvent).status.message;
        if (msg && msg.parts && msg.parts.length > 0 && msg.parts[0].type === 'text') {
          return (msg.parts[0] as TextPart).text;
        }
        return '';
      })
      .join('');
    expect(textContent).toMatch(/Processing|request/i);
  });

  test('Should handle streaming with artifact chunks', async () => {
    scenariosExecutor.configure({
      artifactContent: 'Unit 734, a small rover with oversized optical sensors, trundled across the ochre plains. Its mission: to find the source of a peculiar signal. Olympus Mons loomed, a silent giant, as Unit 734 beeped excitedly.'
    });
    const taskId = `task-stream-artifact-${uuidv4()}`;
    const streamingChunks: SendTaskStreamingResponse[] = [];
    for await (const chunk of client.sendTaskSubscribe({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{ 
          type: 'text', 
          text: 'Write a story and stream it as an artifact' 
        }]
      }
    })) {
      streamingChunks.push(chunk);
    }
    const artifactEvents = streamingChunks.filter(
      (chunk): chunk is SendTaskStreamingResponse & { result: TaskArtifactUpdateEvent } =>
        !!chunk.result && (chunk.result as any).type === 'taskArtifactUpdate'
    ).map(chunk => chunk.result as TaskArtifactUpdateEvent);
    expect(artifactEvents.length).toBeGreaterThan(0);
    let fullArtifactContent = '';
    for (const event of artifactEvents) {
      const textPart = event.artifact.parts[0] as TextPart;
      if (!event.artifact.append) {
        fullArtifactContent = textPart.text;
      } else {
        fullArtifactContent += textPart.text;
      }
    }
    expect(fullArtifactContent).toMatch(/Unit 734|Olympus Mons/);
    const lastEvent = artifactEvents[artifactEvents.length - 1];
    expect(lastEvent.artifact.lastChunk).toBe(true);
  });
});
