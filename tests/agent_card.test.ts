import {
  AgentAuthentication,
  AgentCapabilities,
  AgentCard,
  AgentProvider,
  AgentSkill
} from '../src/types/agent_card.js';

describe('Agent Card Types', () => {
  // Helper data
  const MINIMAL_AGENT_AUTH = { schemes: ['Bearer'] };
  const FULL_AGENT_AUTH = {
    schemes: ['Bearer', 'Basic'],
    credentials: '{"tokenUrl": "https://example.com/token"}',
  };

  const MINIMAL_AGENT_SKILL = {
    id: 'skill-123',
    name: 'Recipe Finder',
    description: 'Finds recipes',
    tags: ['cooking'],
  };

  const MINIMAL_AGENT_CARD = {
    authentication: MINIMAL_AGENT_AUTH,
    capabilities: {}, // Required per spec but implementation makes it optional
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json'],
    description: 'Test Agent',
    name: 'TestAgent',
    skills: [MINIMAL_AGENT_SKILL],
    url: 'http://example.com/agent',
    version: '1.0',
  };
  
  const FULL_AGENT_CARD = {
    authentication: MINIMAL_AGENT_AUTH,
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json'],
    description: 'Test Agent',
    name: 'TestAgent',
    skills: [MINIMAL_AGENT_SKILL],
    url: 'https://example.com/agent',
    version: '1.0',
  };

  test('AgentAuthentication should have schemes as required and optional credentials', () => {
    const auth: AgentAuthentication = MINIMAL_AGENT_AUTH;
    expect(auth.schemes).toEqual(['Bearer']);
    expect(auth.credentials).toBeUndefined();

    const authFull: AgentAuthentication = FULL_AGENT_AUTH;
    expect(authFull.schemes).toEqual(['Bearer', 'Basic']);
    expect(authFull.credentials).toBe('{"tokenUrl": "https://example.com/token"}');
  });

  test('AgentCapabilities should handle optional fields as defined in spec', () => {
    // All fields are optional per spec
    const caps: AgentCapabilities = {}; 
    expect(caps.pushNotifications).toBeUndefined();
    expect(caps.stateTransitionHistory).toBeUndefined();
    expect(caps.streaming).toBeUndefined();

    const capsFull: AgentCapabilities = {
      pushNotifications: true,
      stateTransitionHistory: false,
      streaming: true
    };
    expect(capsFull.pushNotifications).toBe(true);
    expect(capsFull.stateTransitionHistory).toBe(false);
    expect(capsFull.streaming).toBe(true);
  });

  test('AgentProvider should have organization and url', () => {
    const provider: AgentProvider = {
      organization: 'Test Org',
      url: 'http://test.org'
    };
    expect(provider.organization).toBe('Test Org');
    expect(provider.url).toBe('http://test.org');
  });

  test('AgentSkill should have required and optional fields according to spec', () => {
    // Note: In the spec, description and tags are optional but the implementation has them as required
    const skill: AgentSkill = MINIMAL_AGENT_SKILL;
    expect(skill.id).toBe('skill-123');
    expect(skill.name).toBe('Recipe Finder');
    expect(skill.description).toBe('Finds recipes');
    expect(skill.tags).toEqual(['cooking']);
    expect(skill.examples).toBeUndefined();
    expect(skill.inputModes).toBeUndefined();
    expect(skill.outputModes).toBeUndefined();
  });

  test('AgentCard should have all required fields according to spec', () => {
    const card: AgentCard = MINIMAL_AGENT_CARD;
    expect(card.name).toBe('TestAgent');  // Required in spec
    expect(card.version).toBe('1.0');     // Required in spec
    expect(card.url).toBe('http://example.com/agent'); // Required in spec
    expect(card.authentication.schemes).toEqual(['Bearer']);
    expect(card.skills.length).toBe(1);   // Required in spec, must have at least one skill
    expect(card.skills[0].id).toBe('skill-123');
    expect(card.provider).toBeUndefined(); // Optional in spec
    expect(card.capabilities).toBeDefined(); // Required in spec, optional in implementation
  });

  test('AgentCard should accept skills with optional fields as defined in spec', () => {
    const skillWithOptionalFields: AgentSkill = {
      id: 'skill-456',
      name: 'Image Generator',
      description: 'Creates images from descriptions',
      tags: ['graphics', 'ai'],
      examples: ['Generate an image of a sunset', 'Create a picture of mountains'],
      inputModes: ['text/plain'],
      outputModes: ['image/png', 'image/jpeg']
    };

    const card: AgentCard = {
      ...MINIMAL_AGENT_CARD,
      skills: [skillWithOptionalFields]
    };

    expect(card.skills[0].examples).toEqual(['Generate an image of a sunset', 'Create a picture of mountains']);
    expect(card.skills[0].inputModes).toEqual(['text/plain']);
    expect(card.skills[0].outputModes).toEqual(['image/png', 'image/jpeg']);
  });

  test('AgentCard should accept provider information as optional per spec', () => {
    const provider: AgentProvider = {
      organization: 'Test Corp Inc.',
      url: 'https://test-corp.example.com'
    };

    const card: AgentCard = {
      ...MINIMAL_AGENT_CARD,
      provider
    };

    expect(card.provider).toBeDefined();
    expect(card.provider?.organization).toBe('Test Corp Inc.');
    expect(card.provider?.url).toBe('https://test-corp.example.com');
  });

  test('AgentCard should handle defaultInputModes and defaultOutputModes per spec', () => {
    // According to spec, these default to ["text/plain"] if omitted
    // But implementation makes them required
    const card = MINIMAL_AGENT_CARD;
    expect(card.defaultInputModes).toEqual(['text/plain']);
    expect(card.defaultOutputModes).toEqual(['application/json']);
  });
});
