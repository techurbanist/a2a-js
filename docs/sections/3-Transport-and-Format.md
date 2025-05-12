<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 3. Transport and Format

### 3.1. Transport Protocol

- A2A communication **MUST** occur over **HTTP(S)**.
- The A2A Server exposes its service at a URL defined in its `AgentCard`.

### 3.2. Data Format

A2A uses **[JSON-RPC 2.0](https://www.jsonrpc.org/specification)** as the payload format for all requests and responses (excluding the SSE stream wrapper).

- Client requests and server responses **MUST** adhere to the JSON-RPC 2.0 specification.
- The `Content-Type` header for HTTP requests and responses containing JSON-RPC payloads **MUST** be `application/json`.

### 3.3. Streaming Transport (Server-Sent Events)

When streaming is used for methods like `tasks/sendSubscribe` or `tasks/resubscribe`:

- The server responds with an HTTP `200 OK` status and a `Content-Type` header of `text/event-stream`.
- The body of this HTTP response contains a stream of **[Server-Sent Events (SSE)](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)** as defined by the W3C.
- Each SSE `data` field contains a complete JSON-RPC 2.0 Response object (specifically, a [`SendTaskStreamingResponse`](#721-sendtaskstreamingresponse-object)).

