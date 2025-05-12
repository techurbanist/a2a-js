/**
 * Type definitions for the Agent Card for A2A Protocol
 */

/**
 * Represents the authentication requirements for an agent
 */
export interface AgentAuthentication {
  /**
   * Authentication schemes supported (e.g. Basic, Bearer)
   */
  schemes: string[];

  /**
   * Credentials a client should use for private cards
   * 
   * Optional field, MAY contain non-secret, scheme-specific information.
   * Examples: For "OAuth2", this could be a JSON string with tokenUrl, authorizationUrl, scopes.
   * For "ApiKey", it could specify the header name (in: "header", name: "X-Custom-API-Key").
   * MUST NOT contain plaintext secrets (e.g., actual API key values, passwords).
   */
  credentials?: string;
}

/**
 * Represents optional capabilities supported by an agent
 */
export interface AgentCapabilities {
  /**
   * True if the agent can notify updates to client
   */
  pushNotifications?: boolean;

  /**
   * True if the agent exposes status change history for tasks
   */
  stateTransitionHistory?: boolean;

  /**
   * True if the agent supports server-sent events
   */
  streaming?: boolean;
}

/**
 * Represents a service provider of an agent
 */
export interface AgentProvider {
  /**
   * Agent provider's organization name
   */
  organization: string;

  /**
   * Agent provider's URL
   */
  url: string;
}

/**
 * Represents a unit of capability that an agent can perform
 */
export interface AgentSkill {
  /**
   * Unique identifier for the agent's skill
   */
  id: string;

  /**
   * Human readable name of the skill
   */
  name: string;

  /**
   * Description of the skill
   */
  description: string;

  /**
   * Set of tagwords describing classes of capabilities for this specific skill
   */
  tags: string[];

  /**
   * Example scenarios that the skill can perform
   */
  examples?: string[];

  /**
   * The set of interaction modes that the skill supports
   */
  inputModes?: string[];

  /**
   * Supported mime types for output
   */
  outputModes?: string[];
}

/**
 * Represents an agent card containing metadata about an agent
 * 
 * The Agent Card is a JSON document that describes the server's identity, 
 * capabilities, skills, service endpoint URL, and how clients should authenticate and interact with it.
 */
export interface AgentCard {
  /**
   * Name of the agent
   */
  name: string;

  /**
   * Description of the agent
   */
  description: string;

  /**
   * URL where the agent API is accessible
   */
  url: string;

  /**
   * Version of the agent
   */
  version: string;

  /**
   * Default input modes supported by the agent
   */
  defaultInputModes: string[];

  /**
   * Default output modes supported by the agent
   */
  defaultOutputModes: string[];

  /**
   * Skills provided by the agent
   */
  skills: AgentSkill[];

  /**
   * Authentication details
   */
  authentication: AgentAuthentication;

  /**
   * Optional agent capabilities
   */
  capabilities?: AgentCapabilities;

  /**
   * Agent provider information
   */
  provider?: AgentProvider;
}
