<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 8. Error Handling

A2A uses standard [JSON-RPC 2.0 error codes and structure](https://www.jsonrpc.org/specification#error_object) for reporting errors. Errors are returned in the `error` member of the `JSONRPCResponse` object. See [`JSONRPCError` Object definition](#612-jsonrpcerror-object).

### 8.1. Standard JSON-RPC Errors

These are standard codes defined by the JSON-RPC 2.0 specification.

| Code                 | JSON-RPC Spec Meaning | Typical A2A `message`     | Description                                                                                  |
| :------------------- | :-------------------- | :------------------------ | :------------------------------------------------------------------------------------------- |
| `-32700`             | Parse error           | Invalid JSON payload      | Server received JSON that was not well-formed.                                               |
| `-32600`             | Invalid Request       | Invalid JSON-RPC Request  | The JSON payload was valid JSON, but not a valid JSON-RPC Request object.                    |
| `-32601`             | Method not found      | Method not found          | The requested A2A RPC `method` (e.g., `"tasks/foo"`) does not exist or is not supported.     |
| `-32602`             | Invalid params        | Invalid method parameters | The `params` provided for the method are invalid (e.g., wrong type, missing required field). |
| `-32603`             | Internal error        | Internal server error     | An unexpected error occurred on the server during processing.                                |
| `-32000` to `-32099` | Server error          | _(Server-defined)_        | Reserved for implementation-defined server-errors. A2A-specific errors use this range.       |

### 8.2. A2A-Specific Errors

These are custom error codes defined within the JSON-RPC server error range (`-32000` to `-32099`) to provide more specific feedback about A2A-related issues. Servers **SHOULD** use these codes where applicable.

| Code     | Error Name (Conceptual)             | Typical `message` string           | Description                                                                                                                                                                                                                          |
| :------- | :---------------------------------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-32001` | `TaskNotFoundError`                 | Task not found                     | The specified task `id` does not correspond to an existing or active task. It might be invalid, expired, or already completed and purged.                                                                                            |
| `-32002` | `TaskNotCancelableError`            | Task cannot be canceled            | An attempt was made to cancel a task that is not in a cancelable state (e.g., it has already reached a terminal state like `completed`, `failed`, or `canceled`).                                                                    |
| `-32003` | `PushNotificationNotSupportedError` | Push Notification is not supported | Client attempted to use push notification features (e.g., `tasks/pushNotification/set`) but the server agent does not support them (i.e., `AgentCard.capabilities.pushNotifications` is `false`).                                    |
| `-32004` | `OperationNotSupportedError`        | This operation is not supported    | The requested operation or a specific aspect of it (perhaps implied by parameters) is not supported by this server agent implementation. Broader than just method not found.                                                         |
| `-32005` | `ContentTypeNotSupportedError`      | Incompatible content types         | A [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) provided in the request's `message.parts` (or implied for an artifact) is not supported by the agent or the specific skill being invoked. |
| `-32006` | `StreamingNotSupportedError`        | Streaming is not supported         | Client attempted `tasks/sendSubscribe` or `tasks/resubscribe` but the server agent does not support streaming (i.e., `AgentCard.capabilities.streaming` is `false`).                                                                 |
| `-32007` | `AuthenticationRequiredError`       | Authentication required            | The request lacks necessary authentication credentials, or the provided credentials are invalid or insufficient. This often accompanies an HTTP `401 Unauthorized` status.                                                           |
| `-32008` | `AuthorizationFailedError`          | Authorization failed               | The authenticated identity is not authorized to perform the requested action or access the specified resource (e.g., a specific task or skill). This often accompanies an HTTP `403 Forbidden` status.                               |
| `-32009` | `InvalidTaskStateError`             | Invalid task state for operation   | The operation is not valid for the task's current `TaskState` (e.g., trying to send a message to a task that is already `completed`).                                                                                                |
| `-32010` | `RateLimitExceededError`            | Rate limit exceeded                | The client has made too many requests in a given amount of time.                                                                                                                                                                     |
| `-32011` | `ResourceUnavailableError`          | A required resource is unavailable | The server cannot complete the request because a necessary downstream resource or service is temporarily or permanently unavailable.                                                                                                 |

Servers MAY define additional error codes within the `-32000` to `-32099` range for more specific scenarios not covered above, but they **SHOULD** document these clearly. The `data` field of the `JSONRPCError` object can be used to provide more structured details for any error.

