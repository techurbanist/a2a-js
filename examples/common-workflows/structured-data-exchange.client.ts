import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams, Part } from '../../src/index.js';

/**
 * Structured Data Exchange (Requesting and Providing JSON)
 * Client asks for a list of open support tickets in a specific JSON format.
 */
async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const params: TaskSendParams = {
    id: uuidv4(),
    message: {
      role: Role.User,
      parts: [
        {
          type: 'text',
          text: 'List my open IT support tickets created in the last week.',
          metadata: {
            desiredOutputMimeType: 'application/json',
            desiredOutputSchemaRef: 'https://schemas.example.com/supportTicketList_v1.json'
          }
        }
      ]
    },
  };
  const response = await client.sendTask(params);
  console.log('Structured data response:', JSON.stringify(response, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
