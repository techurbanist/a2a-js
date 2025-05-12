import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '../../src/index.js';
// Import Role directly from protocol_objects.ts as it's exported as a type in index.ts
import { Role } from '../../src/types/protocol_objects.js';

/**
 * Simple Hello World client example
 */
async function main() {
  // Create an Axios client
  const axiosClient = axios.create();
  
  // Create the A2A client
  const client = await A2AClient.getClientFromAgentCardUrl(
    axiosClient,
    'http://localhost:9999'
  );

  console.log('Testing basic request...');
  
  // Send a basic message
  const basicResponse = await client.sendMessage({
    message: {
      role: Role.User,
      parts: [{ type: 'text', text: 'Hello' }],
      messageId: uuidv4()
    }
  });
  
  console.log('Basic Response:', JSON.stringify(basicResponse, null, 2));
  
  console.log('\nTesting streaming request...');
  
  // Send a streaming message
  console.log('Sending streaming request...');
  try {
    await client.sendMessageStreaming(
      {
        message: {
          role: Role.User,
          parts: [{ type: 'text', text: 'Hello streaming' }],
          messageId: uuidv4()
        }
      },
      uuidv4(),
      (chunk: any) => {
        console.log('Stream Chunk:', JSON.stringify(chunk, null, 2));
        
        // If this is a message with text, let's print it more user-friendly
        if (chunk && 'result' in chunk && chunk.result && 'parts' in chunk.result) {
          const textParts = chunk.result.parts
            .filter((part: any) => part.type === 'text')
            .map((part: any) => (part as any).text)
            .join('');
          
          if (textParts) {
            console.log('Message content:', textParts);
          }
        }
      }
    );
    
    console.log('Streaming complete');
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
