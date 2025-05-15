/**
 * @fileoverview Type definitions for the A2A Agent Card, as per the A2A Protocol Specification (see docs/sections/5-Agent-Discovery-The-Agent-Card.md).
 *
 * These interfaces describe the structure of the Agent Card JSON document, which conveys identity, capabilities, authentication, and skills of an A2A server.
 */

/**
 * Describes the authentication requirements for accessing the agent's `url` endpoint.
 *
 * @see Section 5.5.3 of the A2A Protocol Specification
 * @property {string[]} schemes - Array of authentication scheme names supported/required by the agent's endpoint (e.g., "Bearer", "Basic", "OAuth2", "ApiKey"). Standard names (e.g., from OpenAPI specification, IANA registry) SHOULD be used where applicable. An empty array means no specific A2A-level schemes are advertised.
 * @property {string|null} [credentials] - Optional non-secret, scheme-specific configuration info. Examples: For "OAuth2", this could be a JSON string with `tokenUrl`, `authorizationUrl`, `scopes`. For "ApiKey", it could specify the header name (`in: "header"`, `name: "X-Custom-API-Key"`). **MUST NOT contain plaintext secrets (e.g., actual API key values, passwords).** If this field contains sensitive URLs or configuration, the endpoint serving the Agent Card MUST be secured.
 */
export interface AgentAuthentication {
  schemes: string[];
  credentials?: string | null;
}

/**
 * Specifies optional A2A protocol features supported by the agent.
 *
 * @see Section 5.5.2 of the A2A Protocol Specification
 * @property {boolean} [streaming=false] - If true, the agent supports `tasks/sendSubscribe` and `tasks/resubscribe` for real-time updates via Server-Sent Events (SSE).
 * @property {boolean} [pushNotifications=false] - If true, the agent supports `tasks/pushNotification/set` and `tasks/pushNotification/get` for asynchronous task updates via webhooks.
 * @property {boolean} [stateTransitionHistory=false] - If true, the agent may include a detailed history of status changes within the `Task` object (future enhancement; specific mechanism TBD).
 */
export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

/**
 * Information about the organization or entity providing the agent.
 *
 * @see Section 5.5.1 of the A2A Protocol Specification
 * @property {string} organization - Name of the organization/entity.
 * @property {string|null} [url] - URL for the provider's organization website or relevant contact page.
 */
export interface AgentProvider {
  organization: string;
  url?: string | null;
}

/**
 * Describes a specific capability, function, or area of expertise the agent can perform or address.
 *
 * @see Section 5.5.4 of the A2A Protocol Specification
 * @property {string} id - A unique identifier for this skill within the context of this agent. Clients MAY use this ID to request a specific skill if the agent supports such dispatch.
 * @property {string} name - Human-readable name of the skill (e.g., "Currency Conversion Service").
 * @property {string|null} [description] - Detailed description of what the skill does, its purpose, and any important considerations. [CommonMark](https://commonmark.org/) MAY be used for rich text formatting.
 * @property {string[]|null} [tags] - Array of keywords or categories for discoverability and categorization (e.g., ["finance", "conversion"]).
 * @property {string[]|null} [examples] - Array of example prompts, inputs, or use cases illustrating how to use this skill.
 * @property {string[]|null} [inputModes] - Overrides `AgentCard.defaultInputModes` specifically for this skill. If null or omitted, the agent's `defaultInputModes` apply.
 * @property {string[]|null} [outputModes] - Overrides `AgentCard.defaultOutputModes` specifically for this skill. If null or omitted, the agent's `defaultOutputModes` apply.
 */
export interface AgentSkill {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  examples?: string[] | null;
  inputModes?: string[] | null;
  outputModes?: string[] | null;
}

/**
 * An AgentCard conveys key information about an A2A Server.
 *
 * @see Section 5.5 of the A2A Protocol Specification
 * @property {string} name - Human-readable name of the agent (e.g., "Recipe Advisor Agent").
 * @property {string|null} [description] - Human-readable description of the agent and its general purpose. [CommonMark](https://commonmark.org/) MAY be used for rich text formatting.
 * @property {string} url - The base URL endpoint for the agent's A2A service (where JSON-RPC requests are sent). Must be an absolute HTTPS URL for production. HTTP MAY be used for local development/testing only.
 * @property {AgentProvider|null} [provider] - Information about the organization or entity providing the agent.
 * @property {string} version - Version string for the agent or its A2A implementation (format is defined by the provider, e.g., "1.0.0").
 * @property {string|null} [documentationUrl] - URL pointing to human-readable documentation for the agent (e.g., API usage, detailed skill descriptions).
 * @property {AgentCapabilities} capabilities - Specifies optional A2A protocol features supported by this agent.
 * @property {AgentAuthentication|null} [authentication] - Authentication schemes required to interact with the agent's `url` endpoint. If null, omitted, or an empty `schemes` array, no A2A-level authentication is explicitly advertised (NOT recommended for production; other security like network ACLs might still apply).
 * @property {string[]} [defaultInputModes] - Array of MIME types the agent generally accepts as input across all skills, unless overridden by a specific skill. Default if omitted: ["text/plain"].
 * @property {string[]} [defaultOutputModes] - Array of MIME types the agent generally produces as output across all skills, unless overridden by a specific skill. Default if omitted: ["text/plain"].
 * @property {AgentSkill[]} skills - An array of specific skills or capabilities the agent offers. **Must contain at least one skill if the agent is expected to perform actions beyond simple presence.**
 */
export interface AgentCard {
  name: string;
  description?: string | null;
  url: string;
  provider?: AgentProvider | null;
  version: string;
  documentationUrl?: string | null;
  capabilities: AgentCapabilities;
  authentication?: AgentAuthentication | null;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills: AgentSkill[];
}
