import { 
  CancelTaskRequest, 
  CancelTaskResponse, 
  SendMessageRequest, 
  SendMessageResponse, 
  SendMessageStreamingRequest, 
  SendMessageStreamingResponse,
  Task,
  TaskResubscriptionRequest
} from '../types';

/**
 * Interface for agent execution
 */
export interface AgentExecutor {
  /**
   * Handle message send request
   * 
   * @param request - Send message request
   * @param task - Associated task (if any)
   * @returns Promise resolving to the send message response
   */
  onMessageSend(
    request: SendMessageRequest,
    task?: Task
  ): Promise<SendMessageResponse>;

  /**
   * Handle message stream request
   * 
   * @param request - Send message streaming request
   * @param task - Associated task (if any)
   * @returns AsyncGenerator yielding streaming responses
   */
  onMessageStream(
    request: SendMessageStreamingRequest,
    task?: Task
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown>;

  /**
   * Handle task cancel request
   * 
   * @param request - Cancel task request
   * @param task - Task to cancel
   * @returns Promise resolving to the cancel task response
   */
  onCancel(
    request: CancelTaskRequest,
    task: Task
  ): Promise<CancelTaskResponse>;

  /**
   * Handle task resubscription request
   * 
   * @param request - Task resubscription request
   * @param task - Task to resubscribe to
   * @returns AsyncGenerator yielding streaming responses
   */
  onResubscribe(
    request: TaskResubscriptionRequest,
    task: Task
  ): AsyncGenerator<SendMessageStreamingResponse, void, unknown>;
}
