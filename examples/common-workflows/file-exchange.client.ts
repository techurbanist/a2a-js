import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/client/index.js';
import { Role, TaskSendParams, Part } from '../../src/index.js';

/**
 * File Exchange (Upload and Download)
 * Client sends an image (as base64 string for demo), expects a file artifact in response.
 */
async function main() {
  const client = new A2AClient('http://localhost:9999/', fetch);
  const params: TaskSendParams = {
    id: uuidv4(),
    message: {
      role: Role.User,
      parts: [
        { type: 'text', text: 'Analyze this image and highlight any faces.' },
        {
          type: 'file',
          file: {
            name: 'input_image.png',
            mimeType: 'image/png',
            bytes: 'iVBORw0KGgoAAAANSUhEUgAAAAUA...' // Example base64
          }
        }
      ]
    },
  };
  const response = await client.sendTask(params);
  console.log('File exchange response:', JSON.stringify(response, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
