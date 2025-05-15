import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams, TaskState } from '../../src/index.js';

/**
 * Multi-Turn Interaction (Input Required)
 * Client asks to book a flight, agent requests more info, client provides it.
 */
async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const taskId = uuidv4();

  // Step 1: Initial request
  let params: TaskSendParams = {
    id: taskId,
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: `I'd like to book a flight.` }],
    },
  };
  let response = await client.sendTask(params);
  console.log('Step 1 Response:', JSON.stringify(response, null, 2));

  // Step 2: If input required, provide more info
  if (response && response.status && response.status.state === TaskState.InputRequired) {
    params = {
      id: taskId, // Same task ID
      message: {
        role: Role.User,
        parts: [{ type: 'text', text: 'I want to fly from New York (JFK) to London (LHR) around October 10th, returning October 17th.' }],
      },
    };
    response = await client.sendTask(params);
    console.log('Step 2 Response:', JSON.stringify(response, null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
