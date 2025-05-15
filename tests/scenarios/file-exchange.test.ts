import { v4 as uuidv4 } from 'uuid';
import { ScenariosAgentExecutor, InMemoryA2AClient } from './test-helpers.js';
import { Role, TaskState, TextPart, FilePart, FileContent } from '../../src/types/index.js';

describe('9.5. File Exchange (Upload and Download)', () => {
  let scenariosExecutor: ScenariosAgentExecutor;
  let client: InMemoryA2AClient;

  beforeEach(() => {
    scenariosExecutor = new ScenariosAgentExecutor();
    client = new InMemoryA2AClient(scenariosExecutor);
  });

  test('Should handle file upload and download', async () => {
    scenariosExecutor.configure({
      artifactContent: 'This is the processed image file content'
    });
    const taskId = `task-file-${uuidv4()}`;
    const sampleImageBytes = 'iVBORw0KGgoAAAANSUhEUgAAAAUA';
    const fileContent: FileContent = {
      name: 'input_image.png',
      mimeType: 'image/png',
      bytes: sampleImageBytes
    };
    const response = await client.sendTask({
      id: taskId,
      message: {
        role: Role.User,
        parts: [
          { type: 'text', text: 'Analyze this image and highlight any faces.' },
          { type: 'file', file: fileContent }
        ]
      }
    });
    expect(response).not.toBeNull();
    if (!response) throw new Error('response is null');
    expect(response.id).toBe(taskId);
    expect(response.status.state).toBe(TaskState.Completed);
    if (response.artifacts && response.artifacts.length > 0) {
      const artifact = response.artifacts[0];
      expect(artifact.parts[0].type).toBe('file');
      const filePart = artifact.parts[0] as FilePart;
      expect(filePart.file.name).toBeDefined();
      expect(filePart.file.mimeType).toBe('image/png');
      expect(filePart.file.bytes || filePart.file.uri).toBeTruthy();
    }
  });
});
