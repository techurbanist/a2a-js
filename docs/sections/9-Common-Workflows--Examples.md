<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 9. Common Workflows & Examples

This section provides illustrative JSON examples of common A2A interactions. Timestamps, session IDs, and request/response IDs are for demonstration purposes. For brevity, some optional fields might be omitted if not central to the example.

### 9.1. Basic Task Execution (Synchronous / Polling Style)

**Scenario:** Client asks a simple question, and the agent responds quickly.

1. **Client sends a message using `tasks/send`:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-001",
     "method": "tasks/send",
     "params": {
       "id": "task-abc-123",
       "sessionId": "session-xyz-789",
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "What is the capital of France?"
           }
         ]
       }
     }
   }
   ```

2. **Server processes the request and responds (task completes quickly):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-001",
     "result": {
       "id": "task-abc-123",
       "sessionId": "session-xyz-789",
       "status": {
         "state": "completed",
         "message": {
           "role": "agent",
           "parts": [
             {
               "type": "text",
               "text": "The capital of France is Paris."
             }
           ]
         },
         "timestamp": "2024-03-15T10:00:05Z"
       },
       "artifacts": [
         {
           "name": "Answer",
           "index": 0,
           "parts": [
             {
               "type": "text",
               "text": "The capital of France is Paris."
             }
           ]
         }
       ]
     }
   }
   ```

   _If the task were longer-running, the server might initially respond with `status.state: "working"`. The client would then periodically call `tasks/get` with `params: {"id": "task-abc-123"}` until the task reaches a terminal state._

### 9.2. Streaming Task Execution (SSE)

**Scenario:** Client asks the agent to write a short story, and the agent streams the story incrementally.

1. **Client sends a message and subscribes using `tasks/sendSubscribe`:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-002",
     "method": "tasks/sendSubscribe",
     "params": {
       "id": "task-story-456",
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "Write a very short story about a curious robot exploring Mars."
           }
         ]
       }
     }
   }
   ```

2. **Server responds with HTTP 200 OK, `Content-Type: text/event-stream`, and starts sending SSE events:**

   _Event 1: Task status update - working_

   ```sse
   id: sse-evt-101
   event: message
   data: {"jsonrpc":"2.0","id":"req-002","result":{"id":"task-story-456","status":{"state":"working","message":{"role":"agent","parts":[{"type":"text","text":"Okay, I'm starting to write that story for you..."}]},"timestamp":"2024-03-15T10:05:01Z"},"final":false}}
   ```

   _Event 2: Artifact update - first chunk of the story_

   ```sse
   id: sse-evt-102
   event: message
   data: {"jsonrpc":"2.0","id":"req-002","result":{"id":"task-story-456","artifact":{"name":"MarsStory.txt","index":0,"parts":[{"type":"text","text":"Unit 734, a small rover with oversized optical sensors, trundled across the ochre plains. "}]}}}
   ```

   _Event 3: Artifact update - second chunk (appended)_

   ```sse
   id: sse-evt-103
   event: message
   data: {"jsonrpc":"2.0","id":"req-002","result":{"id":"task-story-456","artifact":{"name":"MarsStory.txt","index":0,"append":true,"parts":[{"type":"text","text":"Its mission: to find the source of a peculiar signal. "}]}}}
   ```

   _Event 4: Artifact update - final chunk_

   ```sse
   id: sse-evt-104
   event: message
   data: {"jsonrpc":"2.0","id":"req-002","result":{"id":"task-story-456","artifact":{"name":"MarsStory.txt","index":0,"append":true,"lastChunk":true,"parts":[{"type":"text","text":"Olympus Mons loomed, a silent giant, as Unit 734 beeped excitedly."}]}}}
   ```

   _Event 5: Task status update - completed_

   ```sse
   id: sse-evt-105
   event: message
   data: {"jsonrpc":"2.0","id":"req-002","result":{"id":"task-story-456","status":{"state":"completed","message":{"role":"agent","parts":[{"type":"text","text":"The story is complete!"}]},"timestamp":"2024-03-15T10:05:05Z"},"final":true}}
   ```

   _(Server closes the SSE connection after the `final:true` event)._
   _(Note: SSE `id` and `event` fields are part of the SSE protocol itself, distinct from the JSON-RPC `id` within the `data` payload)._

### 9.3. Multi-Turn Interaction (Input Required)

**Scenario:** Client wants to book a flight, and the agent needs more information.

1. **Client `tasks/send` (initial request):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-003",
     "method": "tasks/send",
     "params": {
       "id": "task-flightbook-789",
       "message": {
         "role": "user",
         "parts": [{ "type": "text", "text": "I'd like to book a flight." }]
       }
     }
   }
   ```

2. **Server responds, task state is `input-required`:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-003",
     "result": {
       "id": "task-flightbook-789",
       "status": {
         "state": "input-required",
         "message": {
           "role": "agent",
           "parts": [
             {
               "type": "text",
               "text": "Sure, I can help with that! Where would you like to fly to, and from where? Also, what are your preferred travel dates?"
             }
           ]
         },
         "timestamp": "2024-03-15T10:10:00Z"
       }
     }
   }
   ```

3. **Client `tasks/send` (providing the requested input, using the _same_ task ID):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-004",
     "method": "tasks/send",
     "params": {
       "id": "task-flightbook-789" /* Same task ID */,
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "I want to fly from New York (JFK) to London (LHR) around October 10th, returning October 17th."
           }
         ]
       }
     }
   }
   ```

4. **Server processes the new input and responds (e.g., task completed or more input needed):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-004",
     "result": {
       "id": "task-flightbook-789",
       "status": {
         "state": "completed",
         "message": {
           "role": "agent",
           "parts": [
             {
               "type": "text",
               "text": "Okay, I've found a flight for you. Confirmation XYZ123. Details are in the artifact."
             }
           ]
         },
         "timestamp": "2024-03-15T10:11:00Z"
       },
       "artifacts": [
         {
           "name": "FlightItinerary.json",
           "parts": [
             {
               "type": "data",
               "data": {
                 "confirmationId": "XYZ123",
                 "from": "JFK",
                 "to": "LHR",
                 "departure": "2024-10-10T18:00:00Z",
                 "arrival": "2024-10-11T06:00:00Z",
                 "returnDeparture": "..."
               }
             }
           ]
         }
       ]
     }
   }
   ```

### 9.4. Push Notification Setup and Usage

**Scenario:** Client requests a long-running report generation and wants to be notified via webhook when it's done.

1. **Client `tasks/send` with `pushNotification` config:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-005",
     "method": "tasks/send",
     "params": {
       "id": "task-reportgen-aaa",
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "Generate the Q1 sales report. This usually takes a while. Notify me when it's ready."
           }
         ]
       },
       "pushNotification": {
         "url": "https://client.example.com/webhook/a2a-notifications",
         "token": "secure-client-token-for-task-aaa",
         "authentication": {
           "schemes": ["Bearer"]
           // Assuming server knows how to get a Bearer token for this webhook audience,
           // or this implies the webhook is public/uses the 'token' for auth.
           // 'credentials' could provide more specifics if needed by the server.
         }
       }
     }
   }
   ```

2. **Server acknowledges the task (e.g., status `submitted` or `working`):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-005",
     "result": {
       "id": "task-reportgen-aaa",
       "status": { "state": "submitted", "timestamp": "2024-03-15T11:00:00Z" }
       // ... other fields ...
     }
   }
   ```

3. **(Later) A2A Server completes the task and POSTs a notification to `https://client.example.com/webhook/a2a-notifications`:**

   - **HTTP Headers might include:**
     - `Authorization: Bearer <server_jwt_for_webhook_audience>` (if server authenticates to webhook)
     - `Content-Type: application/json`
     - `X-A2A-Notification-Token: secure-client-token-for-task-aaa`
   - **HTTP Body (example, actual payload is server-defined, but SHOULD include `taskId` and `status`):**

   ```json
   {
     "eventType": "taskUpdate",
     "taskId": "task-reportgen-aaa",
     "status": { "state": "completed", "timestamp": "2024-03-15T18:30:00Z" },
     "summary": "Q1 sales report generated successfully."
     // Server MAY include more details or a link to fetch the full task.
   }
   ```

4. **Client's Webhook Service:**

   - Receives the POST.
   - Validates the `Authorization` header (if applicable).
   - Validates the `X-A2A-Notification-Token`.
   - Internally processes the notification (e.g., updates application state, notifies end-user).

5. **Client (optionally, upon receiving and validating the push notification) calls `tasks/get` to retrieve full artifacts:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-006",
     "method": "tasks/get",
     "params": { "id": "task-reportgen-aaa" }
   }
   ```

   _(Server responds with the full `Task` object, including the generated report in `Task.artifacts`)_.

### 9.5. File Exchange (Upload and Download)

**Scenario:** Client sends an image for analysis, and the agent returns a modified image.

1. **Client `tasks/send` with a `FilePart` (uploading image bytes):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-007",
     "method": "tasks/send",
     "params": {
       "id": "task-imageanalysis-bbb",
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "Analyze this image and highlight any faces."
           },
           {
             "type": "file",
             "file": {
               "name": "input_image.png",
               "mimeType": "image/png",
               "bytes": "iVBORw0KGgoAAAANSUhEUgAAAAUA..." // Base64 encoded image data
             }
           }
         ]
       }
     }
   }
   ```

2. **Server processes the image and responds with a `FilePart` in an artifact (e.g., providing a URI to the modified image):**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-007",
     "result": {
       "id": "task-imageanalysis-bbb",
       "status": { "state": "completed", "timestamp": "2024-03-15T12:05:00Z" },
       "artifacts": [
         {
           "name": "processed_image_with_faces.png",
           "index": 0,
           "parts": [
             {
               "type": "file",
               "file": {
                 "name": "output.png",
                 "mimeType": "image/png",
                 // Server might provide a URI to a temporary storage location
                 "uri": "https://storage.example.com/processed/task-bbb/output.png?token=xyz"
                 // Or, alternatively, it could return bytes directly:
                 // "bytes": "ASEDGhw0KGgoAAAANSUhEUgAA..."
               }
             }
           ]
         }
       ]
     }
   }
   ```

### 9.6. Structured Data Exchange (Requesting and Providing JSON)

**Scenario:** Client asks for a list of open support tickets in a specific JSON format.

1. **Client `tasks/send`, `Part.metadata` hints at desired output schema/MIME type:**
   _(Note: A2A doesn't formally standardize schema negotiation in v0.1.0, but `metadata` can be used for such hints by convention between client/server)._

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-008",
     "method": "tasks/send",
     "params": {
       "id": "task-gettickets-ccc",
       "message": {
         "role": "user",
         "parts": [
           {
             "type": "text",
             "text": "List my open IT support tickets created in the last week.",
             "metadata": {
               "desiredOutputMimeType": "application/json",
               "desiredOutputSchemaRef": "https://schemas.example.com/supportTicketList_v1.json"
               // This metadata is a convention, not strictly enforced by A2A spec
             }
           }
         ]
       }
     }
   }
   ```

2. **Server responds with a `DataPart` containing the structured JSON data:**

   ```json
   {
     "jsonrpc": "2.0",
     "id": "req-008",
     "result": {
       "id": "task-gettickets-ccc",
       "status": { "state": "completed", "timestamp": "2024-03-15T12:15:00Z" },
       "artifacts": [
         {
           "name": "open_support_tickets.json",
           "index": 0,
           "parts": [
             {
               "type": "data",
               "metadata": {
                 "mimeType": "application/json", // Explicitly state MIME type
                 "schemaRef": "https://schemas.example.com/supportTicketList_v1.json" // Confirming schema
               },
               "data": [
                 {
                   "ticketId": "IT00123",
                   "summary": "Cannot connect to VPN",
                   "status": "Open",
                   "createdDate": "2024-03-14T09:30:00Z"
                 },
                 {
                   "ticketId": "IT00125",
                   "summary": "Printer not working on 3rd floor",
                   "status": "In Progress",
                   "createdDate": "2024-03-13T15:00:00Z"
                 }
               ]
             }
           ]
         }
       ]
     }
   }
   ```

These examples illustrate the flexibility of A2A in handling various interaction patterns and data types. Implementers should refer to the detailed object definitions for all fields and constraints.

