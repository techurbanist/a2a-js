import { v4 as uuidv4 } from 'uuid';
import { ScenariosAgentExecutor, InMemoryA2AClient } from './test-helpers.js';
import { Role, TaskState, TextPart, DataPart } from '../../src/types/index.js';

describe('9.6. Structured Data Exchange (Requesting and Providing JSON)', () => {
  let scenariosExecutor: ScenariosAgentExecutor;
  let client: InMemoryA2AClient;

  beforeEach(() => {
    scenariosExecutor = new ScenariosAgentExecutor();
    client = new InMemoryA2AClient(scenariosExecutor);
  });

  test('Should handle structured data exchange with JSON', async () => {
    scenariosExecutor.configure({
      artifactContent: JSON.stringify([
        {
          ticketId: 'IT00123',
          summary: 'Cannot connect to VPN',
          status: 'Open',
          createdDate: '2024-03-14T09:30:00Z'
        },
        {
          ticketId: 'IT00125',
          summary: 'Printer not working on 3rd floor',
          status: 'In Progress',
          createdDate: '2024-03-13T15:00:00Z'
        }
      ])
    });
    const taskId = `task-json-${uuidv4()}`;
    const response = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [{
          type: 'text',
          text: 'List my open IT support tickets created in the last week.',
          metadata: {
            desiredOutputMimeType: 'application/json',
            desiredOutputSchemaRef: 'https://schemas.example.com/supportTicketList_v1.json'
          }
        }]
      }
    });
    expect(response).not.toBeNull();
    if (!response) throw new Error('response is null');
    expect(response.status.state).toBe(TaskState.Completed);
    if (response.artifacts && response.artifacts.length > 0) {
      const artifact = response.artifacts[0];
      expect(artifact.name).toMatch(/open_support_tickets/);
      expect(artifact.parts[0].type).toBe('data');
      const dataPart = artifact.parts[0] as DataPart;
      expect(dataPart.metadata?.mimeType).toBe('application/json');
      expect(dataPart.metadata?.schemaRef).toBe('https://schemas.example.com/supportTicketList_v1.json');
      expect(Array.isArray(dataPart.data)).toBe(true);
      if (Array.isArray(dataPart.data)) {
        expect(dataPart.data[0]).toHaveProperty('ticketId');
      }
    }
  });

  test('Should accept and return structured JSON data', async () => {
    const taskId = `task-json-data-${uuidv4()}`;
    const structuredData = {
      ticketQuery: {
        status: "open",
        createdAfter: "2023-08-01",
        department: "IT"
      }
    };
    const response = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [
          { 
            type: 'text', 
            text: 'Process this structured data query'
          } as TextPart,
          {
            type: 'data',
            data: structuredData,
            mimeType: 'application/json'
          } as DataPart
        ]
      }
    });
    expect(response).not.toBeNull();
    if (!response) throw new Error('response is null');
    expect(response.id).toBe(taskId);
    expect(response.status.state).toBe(TaskState.Completed);
    expect(response.status.message).toBeDefined();
  });
});
