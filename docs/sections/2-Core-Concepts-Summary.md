<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 2. Core Concepts Summary

A2A revolves around several key concepts. For detailed explanations, please refer to the [Key Concepts guide](./topics/key-concepts.md).

- **A2A Client:** An application or agent that initiates requests to an A2A Server on behalf of a user or another system.
- **A2A Server (Remote Agent):** An agent or agentic system that exposes an A2A-compliant HTTP endpoint, processing tasks and providing responses.
- **Agent Card:** A JSON metadata document published by an A2A Server, describing its identity, capabilities, skills, service endpoint, and authentication requirements.
- **Task:** The fundamental unit of work managed by A2A, identified by a unique ID. Tasks are stateful and progress through a defined lifecycle.
- **Message:** A communication turn within a Task, having a `role` ("user" or "agent") and containing one or more `Parts`.
- **Part:** The smallest unit of content within a Message or Artifact (e.g., `TextPart`, `FilePart`, `DataPart`).
- **Artifact:** An output (e.g., a document, image, structured data) generated by the agent as a result of a task, composed of `Parts`.
- **Streaming (SSE):** Real-time, incremental updates for tasks (status changes, artifact chunks) delivered via Server-Sent Events.
- **Push Notifications:** Asynchronous task updates delivered via server-initiated HTTP POST requests to a client-provided webhook URL, for long-running or disconnected scenarios.
- **Session:** An optional, client-generated identifier to logically group related tasks.

