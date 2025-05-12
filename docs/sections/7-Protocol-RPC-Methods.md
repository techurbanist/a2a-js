<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 7. Protocol RPC Methods

All A2A RPC methods are invoked by the A2A Client by sending an HTTP POST request to the A2A Server's `url` (as specified in its `AgentCard`). The body of the HTTP POST request **MUST** be a `JSONRPCRequest` object, and the `Content-Type` header **MUST** be `application/json`.

The A2A Server's HTTP response body **MUST** be a `JSONRPCResponse` object (or, for streaming methods, an SSE stream where each event's data is a `JSONRPCResponse`). The `Content-Type` for JSON-RPC responses is `application/json`. For SSE streams, it is `text/event-stream`.

### 7.1. `tasks/send`

Sends a message to an agent to initiate a new task or to continue an existing one. This method is suitable for synchronous request/response interactions or when client-side polling (using `tasks/get`) is acceptable for monitoring longer-running tasks.

- **Request `params` type**: [`TaskSendParams`](#711-tasksendparams-object)
- **Response `result` type (on success)**: [`Task`](#61-task-object) (The current or final state of the task after processing the message).
- **Response `error` type (on failure)**: [`JSONRPCError`](#612-jsonrpcerror-object).

#### 7.1.1. `TaskSendParams` Object

```typescript
interface TaskSendParams {
  // The ID for the task.
  // - If this is the first message for a new task, the client generates this ID.
  // - If this message continues an existing task (e.g., providing more input after an `input-required` state),
  //   this ID MUST match the ID of the existing task.
  id: string;
  // Optional client-generated session ID to group this task with others.
  sessionId?: string | null;
  // The message to send to the agent. The `role` within this message is typically "user".
  message: Message;
  // Optional: If initiating a new task, the client MAY include push notification configuration.
  // If provided for an existing task, server behavior (e.g., update config, ignore) is server-dependent.
  // Requires `AgentCard.capabilities.pushNotifications: true`.
  pushNotification?: PushNotificationConfig | null;
  // Optional: If a positive integer `N` is provided, the server SHOULD include the last `N` messages
  // (chronologically) of the task's history in the `Task.history` field of the response.
  // If `0`, `null`, or omitted, no history is explicitly requested (server MAY still include some by default).
  historyLength?: number | null;
  // Arbitrary metadata for this specific `tasks/send` request.
  metadata?: Record<string, any> | null;
}
```

| Field Name         | Type                                                                    | Required | Description                                                                                                          |
| :----------------- | :---------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                                | Yes      | Task ID. If new, the server SHOULD create the task. If existing, this message continues the task.                    |
| `sessionId`        | `string` \| `null`                                                      | No       | Optional client-generated session ID.                                                                                |
| `message`          | [`Message`](#64-message-object)                                         | Yes      | The message content to send. `Message.role` is typically `"user"`.                                                   |
| `pushNotification` | [`PushNotificationConfig`](#68-pushnotificationconfig-object) \| `null` | No       | Optional: sets push notification configuration for the task (usually on the first send). Requires server capability. |
| `historyLength`    | `integer` \| `null`                                                     | No       | If positive, requests the server to include up to `N` recent messages in `Task.history`.                             |
| `metadata`         | `Record<string, any>` \| `null`                                         | No       | Request-specific metadata.                                                                                           |

### 7.2. `tasks/sendSubscribe`

Sends a message to an agent to initiate/continue a task AND subscribes the client to real-time updates for that task via Server-Sent Events (SSE). This method requires the server to have `AgentCard.capabilities.streaming: true`.

- **Request `params` type**: [`TaskSendParams`](#711-tasksendparams-object) (same as `tasks/send`).
- **Response (on successful subscription)**:
    - HTTP Status: `200 OK`.
    - HTTP `Content-Type`: `text/event-stream`.
    - HTTP Body: A stream of Server-Sent Events. Each SSE `data` field contains a [`SendTaskStreamingResponse`](#721-sendtaskstreamingresponse-object) JSON object.
- **Response (on initial subscription failure)**:
    - Standard HTTP error code (e.g., 4xx, 5xx).
    - The HTTP body MAY contain a standard `JSONRPCResponse` with an `error` object detailing the failure.

#### 7.2.1. `SendTaskStreamingResponse` Object

This is the structure of the JSON object found in the `data` field of each Server-Sent Event sent by the server for a `tasks/sendSubscribe` or `tasks/resubscribe` stream. It's a `JSONRPCResponse` where the `result` is one of the event types.

```typescript
interface SendTaskStreamingResponse extends JSONRPCResponse {
  // The `id` MUST match the `id` from the originating `tasks/sendSubscribe` (or `tasks/resubscribe`)
  // JSON-RPC request that established this SSE stream.
  id: string | number; // Overrides JSONRPCResponse 'id' type for clarity and to emphasize it matches the original request.
  // The `result` field contains the actual event payload for this streaming update.
  // It will be either a TaskStatusUpdateEvent or a TaskArtifactUpdateEvent.
  result: TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
  // For streaming events, `error` is typically `null` or absent.
  // If a fatal error occurs that terminates the stream, the server MAY send a final
  // SSE event with this `error` field populated before closing the connection.
  error?: JSONRPCError | null;
}
```

| Field Name | Type                                                                                                                                                 | Required | Description                                                                                                                                            |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jsonrpc`  | `"2.0"` (literal)                                                                                                                                    | Yes      | JSON-RPC version string.                                                                                                                               |
| `id`       | `string` \| `number`                                                                                                                                 | Yes      | Matches the `id` from the originating `tasks/sendSubscribe` or `tasks/resubscribe` request.                                                            |
| `result`   | **Either** [`TaskStatusUpdateEvent`](#722-taskstatusupdateevent-object) <br> **OR** [`TaskArtifactUpdateEvent`](#723-taskartifactupdateevent-object) | Yes      | The event payload: either a status update or an artifact update.                                                                                       |
| `error`    | [`JSONRPCError`](#612-jsonrpcerror-object) \| `null`                                                                                                 | No       | Typically `null` or absent for stream events. If a fatal stream error occurs, this MAY be populated in the final SSE message before the stream closes. |

#### 7.2.2. `TaskStatusUpdateEvent` Object

Carries information about a change in the task's status during streaming. This is one of the possible `result` types in a `SendTaskStreamingResponse`.

```typescript
interface TaskStatusUpdateEvent {
  // The ID of the task being updated. This MUST match the `TaskSendParams.id`
  // from the `tasks/sendSubscribe` request that initiated this stream.
  id: string;
  // The new status object for the task.
  status: TaskStatus;
  // If `true`, this `TaskStatusUpdateEvent` signifies the terminal status update for the current
  // `tasks/sendSubscribe` interaction cycle. This means the task has reached a state like
  // `completed`, `failed`, `canceled`, or `input-required`, and the server does not expect to send
  // more updates for *this specific* `sendSubscribe` request. The server typically closes the SSE
  // connection after sending an event with `final: true`.
  // Default: `false` if omitted.
  final?: boolean;
  // Arbitrary metadata for this specific status update event.
  metadata?: Record<string, any> | null;
}
```

| Field Name | Type                                  | Required | Default | Description                                                                                                                                      |
| :--------- | :------------------------------------ | :------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | `string`                              | Yes      |         | Task ID being updated, matching the original request's task ID.                                                                                  |
| `status`   | [`TaskStatus`](#62-taskstatus-object) | Yes      |         | The new `TaskStatus` object.                                                                                                                     |
| `final`    | `boolean`                             | No       | `false` | If `true`, indicates this is the terminal status update for the current stream cycle. The server typically closes the SSE connection after this. |
| `metadata` | `Record<string, any>` \| `null`       | No       | `null`  | Event-specific metadata.                                                                                                                         |

#### 7.2.3. `TaskArtifactUpdateEvent` Object

Carries a new or updated artifact (or a chunk of an artifact) generated by the task during streaming. This is one of the possible `result` types in a `SendTaskStreamingResponse`.

```typescript
interface TaskArtifactUpdateEvent {
  // The ID of the task that generated this artifact. This MUST match the `TaskSendParams.id`
  // from the `tasks/sendSubscribe` request that initiated this stream.
  id: string;
  // The artifact data. This could be a complete artifact or an incremental chunk.
  // The client uses `artifact.index`, `artifact.append`, and `artifact.lastChunk`
  // to correctly assemble or update the artifact on its side.
  artifact: Artifact;
  // Arbitrary metadata for this specific artifact update event.
  metadata?: Record<string, any> | null;
}
```

| Field Name | Type                              | Required | Description                                                                                                                                                          |
| :--------- | :-------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `id`       | `string`                          | Yes      | Task ID that generated the artifact, matching the original request's task ID.                                                                                        |
| `artifact` | [`Artifact`](#67-artifact-object) | Yes      | The `Artifact` data. Could be a complete artifact or an incremental chunk. Use `index`, `append`, and `lastChunk` fields within `Artifact` for client-side assembly. |
| `metadata` | `Record<string, any>` \| `null`   | No       | `null`                                                                                                                                                               | Event-specific metadata. |

### 7.3. `tasks/get`

Retrieves the current state (including status, artifacts, and optionally history) of a previously initiated task. This is typically used for polling the status of a task initiated with `tasks/send`, or for fetching the final state of a task after being notified via a push notification or after an SSE stream has ended.

- **Request `params` type**: [`TaskQueryParams`](#731-taskqueryparams-object)
- **Response `result` type (on success)**: [`Task`](#61-task-object) (A snapshot of the task's current state).
- **Response `error` type (on failure)**: [`JSONRPCError`](#612-jsonrpcerror-object) (e.g., if the task ID is not found, see [`TaskNotFoundError`](#82-a2a-specific-errors)).

#### 7.3.1. `TaskQueryParams` Object

```typescript
interface TaskQueryParams {
  // The ID of the task to retrieve.
  id: string;
  // Optional: If a positive integer `N` is provided, the server SHOULD include the last `N` messages
  // (chronologically) of the task's history in the `Task.history` field of the response.
  // If `0`, `null`, or omitted, no history is explicitly requested.
  historyLength?: number | null;
  // Arbitrary metadata for this specific `tasks/get` request.
  metadata?: Record<string, any> | null;
}
```

| Field Name      | Type                            | Required | Description                                                                              |
| :-------------- | :------------------------------ | :------- | :--------------------------------------------------------------------------------------- |
| `id`            | `string`                        | Yes      | The ID of the task whose current state is to be retrieved.                               |
| `historyLength` | `integer` \| `null`             | No       | If positive, requests the server to include up to `N` recent messages in `Task.history`. |
| `metadata`      | `Record<string, any>` \| `null` | No       | Request-specific metadata.                                                               |

### 7.4. `tasks/cancel`

Requests the cancellation of an ongoing task. The server will attempt to cancel the task, but success is not guaranteed (e.g., the task might have already completed or failed, or cancellation might not be supported at its current stage).

- **Request `params` type**: [`TaskIdParams`](#741-taskidparams-object-for-taskscancel-and-taskspushnotificationget)
- **Response `result` type (on success)**: [`Task`](#61-task-object) (The state of the task after the cancellation attempt. Ideally, `Task.status.state` will be `"canceled"` if successful).
- **Response `error` type (on failure)**: [`JSONRPCError`](#612-jsonrpcerror-object) (e.g., [`TaskNotFoundError`](#82-a2a-specific-errors), [`TaskNotCancelableError`](#82-a2a-specific-errors)).

#### 7.4.1. `TaskIdParams` Object (for `tasks/cancel` and `tasks/pushNotification/get`)

A simple object containing just the task ID and optional metadata.

```typescript
interface TaskIdParams {
  // The ID of the task to which the operation applies (e.g., cancel, get push notification config).
  id: string;
  // Arbitrary metadata for this specific request.
  metadata?: Record<string, any> | null;
}
```

| Field Name | Type                            | Required | Description                |
| :--------- | :------------------------------ | :------- | :------------------------- |
| `id`       | `string`                        | Yes      | The ID of the task.        |
| `metadata` | `Record<string, any>` \| `null` | No       | Request-specific metadata. |

### 7.5. `tasks/pushNotification/set`

Sets or updates the push notification configuration for a specified task. This allows the client to tell the server where and how to send asynchronous updates for the task. Requires the server to have `AgentCard.capabilities.pushNotifications: true`.

- **Request `params` type**: [`TaskPushNotificationConfig`](#610-taskpushnotificationconfig-object)
- **Response `result` type (on success)**: [`TaskPushNotificationConfig`](#610-taskpushnotificationconfig-object) (Confirms the configuration that was set. The server MAY omit or mask any sensitive details like secrets from the `authentication.credentials` field in the response).
- **Response `error` type (on failure)**: [`JSONRPCError`](#612-jsonrpcerror-object) (e.g., [`PushNotificationNotSupportedError`](#82-a2a-specific-errors), [`TaskNotFoundError`](#82-a2a-specific-errors), errors related to invalid `PushNotificationConfig`).

### 7.6. `tasks/pushNotification/get`

Retrieves the current push notification configuration for a specified task. Requires the server to have `AgentCard.capabilities.pushNotifications: true`.

- **Request `params` type**: [`TaskIdParams`](#741-taskidparams-object-for-taskscancel-and-taskspushnotificationget)
- **Response `result` type (on success)**: [`TaskPushNotificationConfig`](#610-taskpushnotificationconfig-object) (The current push notification configuration for the task. If no configuration is set, `pushNotificationConfig` field might be `null` or an empty object. The server MAY omit or mask any sensitive details from the `authentication.credentials` field).
- **Response `error` type (on failure)**: [`JSONRPCError`](#612-jsonrpcerror-object) (e.g., [`PushNotificationNotSupportedError`](#82-a2a-specific-errors), [`TaskNotFoundError`](#82-a2a-specific-errors)).

### 7.7. `tasks/resubscribe`

Allows a client to reconnect to an SSE stream for an ongoing task after a previous connection (from `tasks/sendSubscribe` or an earlier `tasks/resubscribe`) was interrupted. Requires the server to have `AgentCard.capabilities.streaming: true`.

The purpose is to resume receiving _subsequent_ updates. The server's behavior regarding events missed during the disconnection period (e.g., whether it attempts to backfill some missed events or only sends new ones from the point of resubscription) is implementation-dependent and not strictly defined by this specification.

- **Request `params` type**: [`TaskQueryParams`](#731-taskqueryparams-object) (The `historyLength` parameter is typically ignored for resubscription, as the focus is on future events, but it's included for structural consistency).
- **Response (on successful resubscription)**:
    - HTTP Status: `200 OK`.
    - HTTP `Content-Type`: `text/event-stream`.
    - HTTP Body: A stream of Server-Sent Events, identical in format to `tasks/sendSubscribe`, carrying _subsequent_ [`SendTaskStreamingResponse`](#721-sendtaskstreamingresponse-object) events for the task.
- **Response (on resubscription failure)**:
    - Standard HTTP error code (e.g., 4xx, 5xx).
    - The HTTP body MAY contain a standard `JSONRPCResponse` with an `error` object. Failures can occur if the task is no longer active, doesn't exist, or streaming is not supported/enabled for it.

