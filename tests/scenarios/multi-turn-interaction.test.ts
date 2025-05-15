import { v4 as uuidv4 } from 'uuid';
import { ScenariosAgentExecutor, InMemoryA2AClient } from './test-helpers.js';
import { Role, TaskState, TextPart, DataPart } from '../../src/types/index.js';

describe('9.3. Multi-Turn Interaction (Input Required)', () => {
  let scenariosExecutor: ScenariosAgentExecutor;
  let client: InMemoryA2AClient;

  beforeEach(() => {
    scenariosExecutor = new ScenariosAgentExecutor();
    client = new InMemoryA2AClient(scenariosExecutor);
  });

  test('Should handle multi-turn interaction with input-required state', async () => {
    scenariosExecutor.configure({
      inputRequired: true
    });
    const taskId = `task-interactive-${uuidv4()}`;
    const initialResponse = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: "I'd like to book a flight." }]
      }
    });
    expect(initialResponse).not.toBeNull();
    if (!initialResponse) throw new Error('initialResponse is null');
    expect(initialResponse.id).toBe(taskId);
    expect(initialResponse.status.state).toBe(TaskState.InputRequired);
    expect(initialResponse.status.message?.role).toBe(Role.Agent);
    expect(initialResponse.status.message?.parts[0].type).toBe('text');
    expect((initialResponse.status.message?.parts[0] as TextPart).text).toBe('I need more information to proceed. Can you provide additional details?');
    const followupResponse = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'I want to fly from New York (JFK) to London (LHR) around October 10th, returning October 17th.' }]
      }
    });
    expect(followupResponse).not.toBeNull();
    if (!followupResponse) throw new Error('followupResponse is null');
    expect(followupResponse.id).toBe(taskId);
    expect(followupResponse.status.state).toBe(TaskState.Completed);
    if (followupResponse.artifacts && followupResponse.artifacts.length > 0) {
      const artifact = followupResponse.artifacts[0];
      expect(artifact.name).toMatch(/FlightItinerary/);
      expect(artifact.parts[0].type).toBe('data');
      const dataPart = artifact.parts[0] as DataPart;
      expect(dataPart.data).toHaveProperty('confirmationId');
      expect(dataPart.data).toHaveProperty('from');
      expect(dataPart.data).toHaveProperty('to');
    }
  });
});
