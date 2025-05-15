import { Role, TaskState, Message, TextPart, FilePart, FileContent, DataPart, Artifact, TaskStatus, TaskSendParams, Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, CancelTaskRequest, CancelTaskResponse, TaskResubscriptionRequest, SendTaskStreamingResponse } from '../../src/types/index.js';
import { OperationNotSupportedError } from '../../src/types/errors.js';
import { AgentExecutor } from '../../src/server/agent_executor.js';
import { A2AClient } from '../../src/client/index.js';

export class ScenariosTestAgent {
  private artifactContent: string = '';
  private inputRequired: boolean = false;
  private workingState: boolean = false;
  private delay: number = 0;

  configure(options: {
    artifactContent?: string;
    inputRequired?: boolean;
    workingState?: boolean;
    delay?: number;
  }) {
    if (options.artifactContent !== undefined) {
      this.artifactContent = options.artifactContent;
    }
    if (options.inputRequired !== undefined) {
      this.inputRequired = options.inputRequired;
    }
    if (options.workingState !== undefined) {
      this.workingState = options.workingState;
    }
    if (options.delay !== undefined) {
      this.delay = options.delay;
    }
  }

  async invoke(message: string, taskId: string): Promise<{
    responseText: string;
    state: TaskState;
    artifacts?: Artifact[];
  }> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    // Structured Data Exchange scenario
    if (/support tickets/i.test(message)) {
      return {
        responseText: 'Here are your open support tickets.',
        state: TaskState.Completed,
        artifacts: [
          {
            name: 'open_support_tickets.json',
            parts: [
              {
                type: 'data',
                data: JSON.parse(this.artifactContent),
                metadata: {
                  mimeType: 'application/json',
                  schemaRef: 'https://schemas.example.com/supportTicketList_v1.json'
                }
              } as DataPart
            ]
          }
        ]
      };
    }

    // File Exchange scenario
    if (/analyze this image/i.test(message)) {
      return {
        responseText: 'Processed image attached.',
        state: TaskState.Completed,
        artifacts: [
          {
            name: 'processed_image_with_faces.png',
            parts: [
              {
                type: 'file',
                file: {
                  name: 'output.png',
                  mimeType: 'image/png',
                  bytes: 'iVBORw0KGgoAAAANSUhEUgAAAAUA' // sample base64
                },
                metadata: null
              } as FilePart
            ]
          }
        ]
      };
    }

    // If inputRequired is set and the message is a follow-up with details, complete the task
    if (this.inputRequired) {
      if (/from.+to.+\d{4}/i.test(message)) {
        // Simulate a completed booking with a data artifact
        return {
          responseText: 'Your flight is booked! See attached itinerary.',
          state: TaskState.Completed,
          artifacts: [
            {
              name: 'FlightItinerary.json',
              parts: [
                {
                  type: 'data',
                  data: {
                    confirmationId: 'ABC123',
                    from: 'New York (JFK)',
                    to: 'London (LHR)',
                    dates: 'October 10th - October 17th'
                  }
                } as DataPart
              ]
            }
          ]
        };
      }
      if (!message.includes('additional information')) {
        return {
          responseText: 'I need more information to proceed. Can you provide additional details?',
          state: TaskState.InputRequired
        };
      }
    }

    // Default: plain text artifact if configured
    const artifacts = this.artifactContent ? [
      {
        name: 'TestResult.txt',
        parts: [
          { 
            type: 'text', 
            text: this.artifactContent
          } as TextPart
        ]
      }
    ] : undefined;

    return {
      responseText: `Processed request: ${message}`,
      state: this.inputRequired ? TaskState.Completed : (this.workingState ? TaskState.Working : TaskState.Completed),
      artifacts
    };
  }

  async *stream(message: string, taskId: string): AsyncGenerator<{
    content: string;
    done: boolean;
    isStatusUpdate?: boolean;
    state?: TaskState;
    artifactContent?: string;
    artifactName?: string;
    artifactIndex?: number;
    artifactAppend?: boolean;
    artifactLastChunk?: boolean;
  }> {
    if (this.workingState) {
      // Always yield at least 3 status updates for streaming test
      yield { 
        content: 'Starting to process your request...', 
        done: false,
        isStatusUpdate: true,
        state: TaskState.Working
      };
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { 
        content: 'Still working...', 
        done: false,
        isStatusUpdate: true,
        state: TaskState.Working
      };
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { 
        content: 'Almost done...', 
        done: false,
        isStatusUpdate: true,
        state: TaskState.Working
      };
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (this.artifactContent) {
      const chunks = this.artifactContent.match(/.{1,5}/g) || [this.artifactContent];
      let isFirst = true;
      let isLast = false;
      for (let i = 0; i < chunks.length; i++) {
        isLast = i === chunks.length - 1;
        yield { 
          content: isFirst ? 'Generating content...' : (isLast ? 'Finishing up...' : ''),
          done: false,
          artifactContent: chunks[i],
          artifactName: 'StreamedContent.txt',
          artifactIndex: 0,
          artifactAppend: !isFirst,
          artifactLastChunk: isLast
        };
        isFirst = false;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      yield { content: 'Processing ', done: false };
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { content: 'your ', done: false };
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { content: 'request: ', done: false };
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { content: message, done: false };
    }
    if (this.inputRequired && !message.includes('additional information')) {
      yield { 
        content: 'I need more information to proceed. Can you provide additional details?', 
        done: true,
        isStatusUpdate: true,
        state: TaskState.InputRequired
      };
    } else {
      yield { 
        content: '!', 
        done: true,
        isStatusUpdate: true,
        state: TaskState.Completed
      };
    }
  }
}

export class ScenariosAgentExecutor implements AgentExecutor {
  private agent: ScenariosTestAgent;
  private currentTaskId?: string;
  private currentTaskStatus?: TaskStatus;
  private taskStore: Map<string, Task> = new Map(); // Add a simple in-memory task store

  constructor() {
    this.agent = new ScenariosTestAgent();
  }

  configure(options: {
    artifactContent?: string;
    inputRequired?: boolean;
    workingState?: boolean;
    delay?: number;
  }) {
    this.agent.configure(options);
  }

  async onTaskSend(
    params: TaskSendParams,
    task?: Task
  ): Promise<Task> {
    const messageParts = params.message.parts;
    const messageText = messageParts
      .filter(part => part.type === 'text')
      .map(part => (part as TextPart).text)
      .join(' ');
    const taskId = params.id;
    this.currentTaskId = taskId;
    // Look up previous state for multi-turn
    const prevTask = this.taskStore.get(taskId);
    let result;
    if (prevTask && prevTask.status.state === TaskState.InputRequired) {
      // Simulate follow-up: agent should complete
      result = await this.agent.invoke('from New York (JFK) to London (LHR) 2024', taskId);
    } else {
      result = await this.agent.invoke(messageText, taskId);
    }
    const statusMessage: Message = {
      role: Role.Agent,
      parts: [{ type: 'text', text: result.responseText } as TextPart]
    };
    this.currentTaskStatus = {
      state: result.state,
      message: statusMessage,
      timestamp: new Date().toISOString()
    };
    const responseTask: Task = {
      id: taskId,
      status: this.currentTaskStatus,
    };
    if (result.artifacts && result.artifacts.length > 0) {
      responseTask.artifacts = result.artifacts;
    }
    this.taskStore.set(taskId, responseTask); // Store the task
    return responseTask;
  }

  async getTaskById(taskId: string): Promise<Task | undefined> {
    // Simulate a state transition from Working to Completed on the second poll
    const task = this.taskStore.get(taskId);
    if (task && task.status.state === TaskState.Working) {
      // Transition to completed
      const completedTask = { ...task, status: { ...task.status, state: TaskState.Completed } };
      this.taskStore.set(taskId, completedTask);
      return completedTask;
    }
    return task;
  }

  async *onTaskStream(
    params: TaskSendParams,
    task?: Task
  ): AsyncGenerator<SendTaskStreamingResponse, void, unknown> {
    const messageParts = params.message.parts;
    const messageText = messageParts
      .filter(part => part.type === 'text')
      .map(part => (part as TextPart).text)
      .join(' ');
    const taskId = params.id;
    this.currentTaskId = taskId;
    let previousWasStatus = false;
    for await (const chunk of this.agent.stream(messageText, taskId)) {
      if (chunk.isStatusUpdate) {
        const statusMessage: Message = {
          role: Role.Agent,
          parts: [{ type: 'text', text: chunk.content } as TextPart]
        };
        const status: TaskStatus = {
          state: chunk.state || TaskState.Working,
          message: statusMessage,
          timestamp: new Date().toISOString()
        };
        this.currentTaskStatus = status;
        const statusEvent: TaskStatusUpdateEvent = {
          type: 'taskStatusUpdate',
          id: taskId,
          status,
          final: chunk.done
        };
        previousWasStatus = true;
        yield {
          jsonrpc: '2.0',
          id: taskId,
          result: statusEvent as TaskStatusUpdateEvent
        };
      } else if (chunk.artifactContent) {
        const artifact: Artifact = {
          name: chunk.artifactName,
          parts: [{ type: 'text', text: chunk.artifactContent } as TextPart],
          index: chunk.artifactIndex,
          append: chunk.artifactAppend,
          lastChunk: chunk.artifactLastChunk
        };
        const artifactEvent: TaskArtifactUpdateEvent = {
          type: 'taskArtifactUpdate',
          id: taskId,
          artifact
        };
        previousWasStatus = false;
        yield {
          jsonrpc: '2.0',
          id: taskId,
          result: artifactEvent as TaskArtifactUpdateEvent
        };
      }
    }
    if (!previousWasStatus) {
      const status: TaskStatus = {
        state: TaskState.Completed,
        timestamp: new Date().toISOString()
      };
      this.currentTaskStatus = status;
      const statusEvent: TaskStatusUpdateEvent = {
        type: 'taskStatusUpdate',
        id: taskId,
        status,
        final: true
      };
      yield {
        jsonrpc: '2.0',
        id: taskId,
        result: statusEvent as TaskStatusUpdateEvent
      };
    }
  }

  async onCancel(
    request: CancelTaskRequest,
    task: Task
  ): Promise<CancelTaskResponse> {
    if (this.currentTaskId === request.params.id) {
      this.currentTaskStatus = {
        state: TaskState.Canceled,
        timestamp: new Date().toISOString()
      };
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          id: request.params.id,
          status: this.currentTaskStatus
        }
      };
    }
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }

  async *onResubscribe(
    request: TaskResubscriptionRequest,
    task: Task
  ): AsyncGenerator<any, void, unknown> {
    yield {
      jsonrpc: '2.0',
      id: request.id,
      error: new OperationNotSupportedError()
    };
  }

  async onMessageSend(
    request: any,
    task?: Task
  ): Promise<any> {
    if (request && request.params && request.params.id && request.params.message) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: await this.onTaskSend(request.params, task)
      };
    }
    throw new OperationNotSupportedError();
  }

  async *onMessageStream(
    request: any,
    task?: Task
  ): AsyncGenerator<any, void, unknown> {
    if (request && request.params && request.params.id && request.params.message) {
      for await (const resp of this.onTaskStream(request.params, task)) {
        yield resp;
      }
      return;
    }
    throw new OperationNotSupportedError();
  }
}

export async function createClient(url: string): Promise<A2AClient> {
  return new A2AClient(url);
}

export class InMemoryA2AClient {
  constructor(private agentExecutor: ScenariosAgentExecutor) {}

  async sendTask(params: TaskSendParams) {
    return this.agentExecutor.onTaskSend(params);
  }

  async *sendTaskSubscribe(params: TaskSendParams) {
    for await (const chunk of this.agentExecutor.onTaskStream(params)) {
      yield chunk;
    }
  }
}
