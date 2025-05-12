<!-- Extracted from the A2A Protocol Specification -->
<!-- Source: docs/specification.md -->

## 5. Agent Discovery: The Agent Card

### 5.1. Purpose

A2A Servers **MUST** make an Agent Card available. The Agent Card is a JSON document that describes the server's identity, capabilities, skills, service endpoint URL, and how clients should authenticate and interact with it. Clients use this information for discovering suitable agents and for configuring their interactions.

For more on discovery strategies, see the [Agent Discovery guide](./topics/agent-discovery.md).

### 5.2. Discovery Mechanisms

Clients can find Agent Cards through various methods, including but not limited to:

- **Well-Known URI:** Accessing a predefined path on the agent's domain (see [Section 5.3](#53-recommended-location)).
- **Registries/Catalogs:** Querying curated catalogs or registries of agents (which might be enterprise-specific, public, or domain-specific).
- **Direct Configuration:** Clients may be pre-configured with the Agent Card URL or the card content itself.

### 5.3. Recommended Location

If using the well-known URI strategy, the recommended location for an agent's Agent Card is:
`https://{server_domain}/.well-known/agent.json`
This follows the principles of [RFC 8615](https://datatracker.ietf.org/doc/html/rfc8615) for well-known URIs.

### 5.4. Security of Agent Cards

Agent Cards themselves might contain information that is considered sensitive (e.g., the URL of an internal-only agent, or scheme-specific information in `authentication.credentials`).

- If an Agent Card contains sensitive information, the endpoint serving the card **MUST** be protected by appropriate access controls (e.g., mTLS, network restrictions, authentication required to fetch the card).
- It is generally **NOT RECOMMENDED** to include plaintext secrets (like static API keys) directly in an Agent Card. Prefer authentication schemes where clients obtain dynamic credentials out-of-band. If `authentication.credentials` is used, it should be for non-secret information like OAuth flow URLs or API key _names_ (not values).

### 5.5. `AgentCard` Object Structure

```typescript
// An AgentCard conveys key information about an A2A Server:
// - Overall identity and descriptive details.
// - Service endpoint URL.
// - Supported A2A protocol capabilities (streaming, push notifications).
// - Authentication requirements.
// - Default input/output content types (MIME types).
// - A list of specific skills the agent offers.
interface AgentCard {
  // Human-readable name of the agent (e.g., "Recipe Advisor Agent").
  name: string;
  // A human-readable description of the agent and its general purpose.
  // [CommonMark](https://commonmark.org/) MAY be used for rich text formatting.
  // (e.g., "This agent helps users find recipes, plan meals, and get cooking instructions.")
  description?: string | null;
  // The base URL endpoint for the agent's A2A service (where JSON-RPC requests are sent).
  // Must be an absolute HTTPS URL for production (e.g., `https://agent.example.com/a2a/api`).
  // HTTP MAY be used for local development/testing only.
  url: string;
  // Information about the organization or entity providing the agent.
  provider?: AgentProvider | null;
  // Version string for the agent or its A2A implementation
  // (format is defined by the provider, e.g., "1.0.0", "2023-10-26-beta").
  version: string;
  // URL pointing to human-readable documentation for the agent (e.g., API usage, detailed skill descriptions).
  documentationUrl?: string | null;
  // Specifies optional A2A protocol features supported by this agent.
  capabilities: AgentCapabilities;
  // Authentication schemes required to interact with the agent's `url` endpoint.
  // If `null`, omitted, or an empty `schemes` array, no A2A-level authentication is explicitly advertised
  // (NOT recommended for production; other security like network ACLs might still apply).
  authentication?: AgentAuthentication | null;
  // Array of [MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
  // the agent generally accepts as input across all skills, unless overridden by a specific skill.
  // Default if omitted: `["text/plain"]`. Example: `["text/plain", "image/png"]`.
  defaultInputModes?: string[];
  // Array of MIME types the agent generally produces as output across all skills, unless overridden by a specific skill.
  // Default if omitted: `["text/plain"]`. Example: `["text/plain", "application/json"]`.
  defaultOutputModes?: string[];
  // An array of specific skills or capabilities the agent offers.
  // Must contain at least one skill if the agent is expected to perform actions beyond simple presence.
  skills: AgentSkill[];
}
```

| Field Name           | Type                                                               | Required | Description                                                                                                       |
| :------------------- | :----------------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| `name`               | `string`                                                           | Yes      | Human-readable name of the agent.                                                                                 |
| `description`        | `string` \| `null`                                                 | No       | Human-readable description. [CommonMark](https://commonmark.org/) MAY be used.                                    |
| `url`                | `string`                                                           | Yes      | Base URL for the agent's A2A service. Must be absolute. HTTPS for production.                                     |
| `provider`           | [`AgentProvider`](#551-agentprovider-object) \| `null`             | No       | Information about the agent's provider.                                                                           |
| `version`            | `string`                                                           | Yes      | Agent or A2A implementation version string.                                                                       |
| `documentationUrl`   | `string` \| `null`                                                 | No       | URL to human-readable documentation for the agent.                                                                |
| `capabilities`       | [`AgentCapabilities`](#552-agentcapabilities-object)               | Yes      | Specifies optional A2A protocol features supported (e.g., streaming, push notifications).                         |
| `authentication`     | [`AgentAuthentication`](#553-agentauthentication-object) \| `null` | No       | Authentication schemes required. `null` or empty implies no A2A-advertised auth (not recommended for production). |
| `defaultInputModes`  | `string[]`                                                         | No       | Default accepted input MIME types. Defaults to `["text/plain"]` if omitted.                                       |
| `defaultOutputModes` | `string[]`                                                         | No       | Default produced output MIME types. Defaults to `["text/plain"]` if omitted.                                      |
| `skills`             | [`AgentSkill[]`](#554-agentskill-object)                           | Yes      | Array of skills. Must have at least one if the agent performs actions.                                            |

#### 5.5.1. `AgentProvider` Object

Information about the organization or entity providing the agent.

```typescript
interface AgentProvider {
  // Name of the organization or entity.
  organization: string;
  // URL for the provider's organization website or relevant contact page.
  url?: string | null;
}
```

| Field Name     | Type               | Required | Description                             |
| :------------- | :----------------- | :------- | :-------------------------------------- |
| `organization` | `string`           | Yes      | Name of the organization/entity.        |
| `url`          | `string` \| `null` | No       | URL for the provider's website/contact. |

#### 5.5.2. `AgentCapabilities` Object

Specifies optional A2A protocol features supported by the agent.

```typescript
interface AgentCapabilities {
  // If `true`, the agent supports `tasks/sendSubscribe` and `tasks/resubscribe` for real-time
  // updates via Server-Sent Events (SSE). Default: `false`.
  streaming?: boolean;
  // If `true`, the agent supports `tasks/pushNotification/set` and `tasks/pushNotification/get`
  // for asynchronous task updates via webhooks. Default: `false`.
  pushNotifications?: boolean;
  // If `true`, the agent may include a detailed history of status changes
  // within the `Task` object (future enhancement; specific mechanism TBD). Default: `false`.
  stateTransitionHistory?: boolean;
}
```

| Field Name               | Type      | Required | Default | Description                                                                               |
| :----------------------- | :-------- | :------- | :------ | :---------------------------------------------------------------------------------------- |
| `streaming`              | `boolean` | No       | `false` | Indicates support for SSE streaming methods (`tasks/sendSubscribe`, `tasks/resubscribe`). |
| `pushNotifications`      | `boolean` | No       | `false` | Indicates support for push notification methods (`tasks/pushNotification/*`).             |
| `stateTransitionHistory` | `boolean` | No       | `false` | Placeholder for future feature: exposing detailed task status change history.             |

#### 5.5.3. `AgentAuthentication` Object

Describes the authentication requirements for accessing the agent's `url` endpoint.

```typescript
interface AgentAuthentication {
  // Array of authentication scheme names supported/required by the agent's endpoint
  // (e.g., "Bearer", "Basic", "OAuth2", "ApiKey").
  // Standard names (e.g., from OpenAPI specification, IANA registry) SHOULD be used where applicable.
  // An empty array means no specific A2A-level schemes are advertised.
  schemes: string[];
  // Optional field, MAY contain non-secret, scheme-specific information.
  // Examples: For "OAuth2", this could be a JSON string with `tokenUrl`, `authorizationUrl`, `scopes`.
  // For "ApiKey", it could specify the header name (`in: "header"`, `name: "X-Custom-API-Key"`).
  // **CRITICAL**: This field MUST NOT contain plaintext secrets (e.g., actual API key values, passwords).
  // If the Agent Card itself needs to be protected due to this field containing sensitive URLs
  // or configuration, the endpoint serving the Agent Card MUST be secured.
  credentials?: string | null; // E.g., A JSON string parsable by the client for scheme details.
}
```

| Field Name    | Type               | Required | Description                                                                                                                                                                                       |
| :------------ | :----------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemes`     | `string[]`         | Yes      | Array of auth scheme names (e.g., "Bearer", "OAuth2", "ApiKey"). Empty array means no A2A-advertised schemes.                                                                                     |
| `credentials` | `string` \| `null` | No       | Optional non-secret, scheme-specific configuration info (e.g., OAuth URLs, API key header name). **MUST NOT contain plaintext secrets.** Secure the Agent Card if this field implies sensitivity. |

#### 5.5.4. `AgentSkill` Object

Describes a specific capability, function, or area of expertise the agent can perform or address.

```typescript
interface AgentSkill {
  // A unique identifier for this skill within the context of this agent
  // (e.g., "currency-converter", "generate-image-from-prompt", "summarize-text-v2").
  // Clients MAY use this ID to request a specific skill if the agent supports such dispatch.
  id: string;
  // Human-readable name of the skill (e.g., "Currency Conversion Service", "Image Generation AI").
  name: string;
  // Detailed description of what the skill does, its purpose, and any important considerations.
  // [CommonMark](https://commonmark.org/) MAY be used for rich text formatting.
  description?: string | null;
  // Array of keywords or categories for discoverability and categorization
  // (e.g., ["finance", "conversion"], ["media", "generative ai", "image"]).
  tags?: string[] | null;
  // Array of example prompts, inputs, or use cases illustrating how to use this skill
  // (e.g., ["convert 100 USD to EUR", "generate a photorealistic image of a cat wearing a wizard hat"]).
  // These help clients (and potentially end-users or other agents) understand how to formulate requests for this skill.
  examples?: string[] | null;
  // Overrides `agentCard.defaultInputModes` specifically for this skill.
  // If `null` or omitted, the agent's `defaultInputModes` apply.
  inputModes?: string[] | null; // Array of MIME types
  // Overrides `agentCard.defaultOutputModes` specifically for this skill.
  // If `null` or omitted, the agent's `defaultOutputModes` apply.
  outputModes?: string[] | null; // Array of MIME types
}
```

| Field Name    | Type                 | Required | Description                                                                    |
| :------------ | :------------------- | :------- | :----------------------------------------------------------------------------- |
| `id`          | `string`             | Yes      | Unique skill identifier within this agent.                                     |
| `name`        | `string`             | Yes      | Human-readable skill name.                                                     |
| `description` | `string` \| `null`   | No       | Detailed skill description. [CommonMark](https://commonmark.org/) MAY be used. |
| `tags`        | `string[]` \| `null` | No       | Keywords/categories for discoverability.                                       |
| `examples`    | `string[]` \| `null` | No       | Example prompts or use cases demonstrating skill usage.                        |
| `inputModes`  | `string[]` \| `null` | No       | Overrides `defaultInputModes` for this specific skill. Accepted MIME types.    |
| `outputModes` | `string[]` \| `null` | No       | Overrides `defaultOutputModes` for this specific skill. Produced MIME types.   |

### 5.6. Sample Agent Card

```json
{
  "name": "GeoSpatial Route Planner Agent",
  "description": "Provides advanced route planning, traffic analysis, and custom map generation services. This agent can calculate optimal routes, estimate travel times considering real-time traffic, and create personalized maps with points of interest.",
  "url": "https://georoute-agent.example.com/a2a/v1",
  "provider": {
    "organization": "Example Geo Services Inc.",
    "url": "https://www.examplegeoservices.com"
  },
  "version": "1.2.0",
  "documentationUrl": "https://docs.examplegeoservices.com/georoute-agent/api",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": false
  },
  "authentication": {
    "schemes": ["OAuth2"],
    "credentials": "{\"authorizationUrl\": \"https://auth.examplegeoservices.com/authorize\", \"tokenUrl\": \"https://auth.examplegeoservices.com/token\", \"scopes\": {\"route:plan\": \"Allows planning new routes.\", \"map:custom\": \"Allows creating and managing custom maps.\"}}"
  },
  "defaultInputModes": ["application/json", "text/plain"],
  "defaultOutputModes": ["application/json", "image/png"],
  "skills": [
    {
      "id": "route-optimizer-traffic",
      "name": "Traffic-Aware Route Optimizer",
      "description": "Calculates the optimal driving route between two or more locations, taking into account real-time traffic conditions, road closures, and user preferences (e.g., avoid tolls, prefer highways).",
      "tags": ["maps", "routing", "navigation", "directions", "traffic"],
      "examples": [
        "Plan a route from '1600 Amphitheatre Parkway, Mountain View, CA' to 'San Francisco International Airport' avoiding tolls.",
        "{\"origin\": {\"lat\": 37.422, \"lng\": -122.084}, \"destination\": {\"lat\": 37.7749, \"lng\": -122.4194}, \"preferences\": [\"avoid_ferries\"]}"
      ],
      "inputModes": ["application/json", "text/plain"],
      "outputModes": [
        "application/json",
        "application/vnd.geo+json",
        "text/html"
      ]
    },
    {
      "id": "custom-map-generator",
      "name": "Personalized Map Generator",
      "description": "Creates custom map images or interactive map views based on user-defined points of interest, routes, and style preferences. Can overlay data layers.",
      "tags": ["maps", "customization", "visualization", "cartography"],
      "examples": [
        "Generate a map of my upcoming road trip with all planned stops highlighted.",
        "Show me a map visualizing all coffee shops within a 1-mile radius of my current location."
      ],
      "inputModes": ["application/json"],
      "outputModes": [
        "image/png",
        "image/jpeg",
        "application/json",
        "text/html"
      ]
    }
  ]
}
```

