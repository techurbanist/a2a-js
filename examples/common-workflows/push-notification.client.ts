// This is a stub for Push Notification Setup and Usage.
// Full push notification flow requires a running webhook server to receive notifications.
// This example shows how to send a task with pushNotification config.

import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams } from '../../src/index.js';

async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const params: TaskSendParams = {
    id: uuidv4(),
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'Generate the Q1 sales report. This usually takes a while. Notify me when it\'s ready.' }],
    },
    pushNotification: {
      url: 'https://client.example.com/webhook/a2a-notifications',
      token: 'secure-client-token-for-task-aaa',
      authentication: {
        schemes: ['Bearer'],
      },
    },
  };
  const response = await client.sendTask(params);
  console.log('Push notification task response:', JSON.stringify(response, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
