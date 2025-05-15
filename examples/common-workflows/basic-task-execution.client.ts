import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams } from '../../src/index.js';

/**
 * Basic Task Execution (Synchronous / Polling Style)
 * Client asks a simple question, agent responds quickly.
 */
async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const params: TaskSendParams = {
    id: uuidv4(),
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'What is the capital of France?' }],
    },
  };
  const response = await client.sendTask(params);
  console.log('Response:', JSON.stringify(response, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
