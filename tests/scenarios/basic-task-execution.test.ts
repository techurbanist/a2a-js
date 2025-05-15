import { v4 as uuidv4 } from 'uuid';
import { ScenariosAgentExecutor, InMemoryA2AClient } from './test-helpers.js';
import { Role, TaskState, TextPart, Task } from '../../src/types/index.js';

describe('9.1. Basic Task Execution (Synchronous / Polling Style)', () => {
  let scenariosExecutor: ScenariosAgentExecutor;
  let client: InMemoryA2AClient;

  beforeEach(() => {
    scenariosExecutor = new ScenariosAgentExecutor();
    client = new InMemoryA2AClient(scenariosExecutor);
  });

  test('Should handle quick-completing tasks', async () => {
    scenariosExecutor.configure({
      artifactContent: 'The capital of France is Paris.',
      workingState: false
    });
    const taskId = `task-${uuidv4()}`;
    const sessionId = `session-${uuidv4()}`;
    const response = await client.sendTask({
      id: taskId,
      sessionId,
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'What is the capital of France?' }]
      }
    });
    expect(response).not.toBeNull();
    expect(response?.id).toBe(taskId);
    if ('sessionId' in response!) {
      expect(response?.sessionId).toBe(sessionId);
    }
    expect(response?.status).toBeDefined();
    expect(response?.status?.state).toBe(TaskState.Completed);
    expect(response?.status?.message?.role).toBe(Role.Agent);
    expect(response?.status?.message?.parts?.[0]?.type).toBe('text');
    expect((response?.status?.message?.parts?.[0] as TextPart)?.text).toBe('Processed request: What is the capital of France?');
    if (response?.artifacts && response.artifacts.length > 0) {
      expect(response.artifacts[0]?.name).toBeDefined();
      expect(response.artifacts[0]?.parts?.[0]?.type).toBe('text');
      expect((response.artifacts[0]?.parts?.[0] as TextPart)?.text).toContain('Paris');
    }
  });

  test('Should handle tasks with working state that need polling', async () => {
    scenariosExecutor.configure({
      workingState: true,
      delay: 500
    });
    const taskId = `task-${uuidv4()}`;
    const response = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'Run a long calculation' }]
      }
    });
    expect(response).not.toBeNull();
    expect(response?.id).toBe(taskId);
    expect(response?.status?.state).toBe(TaskState.Working);
    let finalTask: Task | undefined;
    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 200));
      // Use the new getTaskById method to simulate polling
      const taskQueryResponse = await scenariosExecutor.getTaskById(taskId);
      if (taskQueryResponse && taskQueryResponse.status?.state === TaskState.Completed) {
        finalTask = taskQueryResponse;
        break;
      }
    }
    expect(finalTask).toBeDefined();
    expect(finalTask?.status?.state).toBe(TaskState.Completed);
  });
});
