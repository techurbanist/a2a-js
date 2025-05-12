/**
 * Type definitions for the A2A Protocol
 */

export type {
  JSONRPCError,
  JSONRPCErrorResponse,
  A2AError
} from './errors.js';

// Import and re-export error enums and classes
export { 
  JSONRPCErrorCode,
  TaskNotFoundError, 
  UnsupportedOperationError, 
  ContentTypeNotSupportedError 
} from './errors.js';

export type {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResult
} from './rpc_methods.js';

export type {
  Message,
  PartBase,
  TextPart,
  DataPart,
  FilePart,
  FileContent,
  Part,
  Task,
  TaskArtifact,
  Artifact,
  TaskStatus
} from './protocol_objects.js';

// Import and re-export enums
export {
  Role,
  TaskState
} from './protocol_objects.js';

export type {
  AgentAuthentication,
  AgentCapabilities,
  AgentProvider,
  AgentSkill,
  AgentCard
} from './agent_card.js';

export type {
  PushNotificationConfig,
  MessageSendParams,
  TaskSendParams,
  TaskQueryParams,
  TaskIdParams,
  TaskPushNotificationConfig,
  SendMessageRequest,
  SendMessageSuccessResponse,
  SendMessageResponse,
  SendMessageStreamingRequest,
  SendMessageStreamingSuccessResponse,
  SendMessageStreamingResponse,
  GetTaskRequest,
  GetTaskSuccessResponse,
  GetTaskResponse,
  CancelTaskRequest,
  CancelTaskSuccessResponse,
  CancelTaskResponse,
  SetTaskPushNotificationConfigRequest,
  SetTaskPushNotificationConfigSuccessResponse,
  SetTaskPushNotificationConfigResponse,
  GetTaskPushNotificationConfigRequest,
  GetTaskPushNotificationConfigSuccessResponse,
  GetTaskPushNotificationConfigResponse,
  TaskResubscriptionRequest,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent
} from './rpc_methods.js';
