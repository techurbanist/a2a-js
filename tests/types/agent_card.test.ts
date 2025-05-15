import {
  AgentAuthentication,
  AgentCapabilities,
  AgentCard,
  AgentProvider,
  AgentSkill
} from '../../src/types/agent_card.js';

describe('Agent Card Types', () => {
  // Helper data
  const MINIMAL_AGENT_AUTH: AgentAuthentication = { schemes: ['Bearer'] };
  const FULL_AGENT_AUTH: AgentAuthentication = {
    schemes: ['Bearer', 'Basic'],
    credentials: '{"tokenUrl": "https://example.com/token"}',
  };

  const MINIMAL_AGENT_SKILL: AgentSkill = {
    id: 'skill-123',
    name: 'Recipe Finder',
    // description, tags, examples, inputModes, outputModes omitted (optional)
  };

  const MINIMAL_AGENT_CARD: AgentCard = {
    authentication: MINIMAL_AGENT_AUTH,
    capabilities: {}, // Required per type, can be empty
    // defaultInputModes, defaultOutputModes omitted (optional)
    // description omitted (optional)
    name: 'TestAgent',
    skills: [MINIMAL_AGENT_SKILL],
    url: 'http://example.com/agent',
    version: '1.0',
  };
  
  const FULL_AGENT_CARD: AgentCard = {
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
    // All fields are optional
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

  test('AgentProvider should have organization as required and url as optional', () => {
    const provider: AgentProvider = {
      organization: 'Test Org',
      // url omitted (optional)
    };
    expect(provider.organization).toBe('Test Org');
    expect(provider.url).toBeUndefined();

    const providerWithUrl: AgentProvider = {
      organization: 'Test Org',
      url: 'http://test.org'
    };
    expect(providerWithUrl.organization).toBe('Test Org');
    expect(providerWithUrl.url).toBe('http://test.org');
  });

  test('AgentSkill should have required and optional fields according to spec', () => {
    const skill: AgentSkill = MINIMAL_AGENT_SKILL;
    expect(skill.id).toBe('skill-123');
    expect(skill.name).toBe('Recipe Finder');
    expect(skill.description).toBeUndefined();
    expect(skill.tags).toBeUndefined();
    expect(skill.examples).toBeUndefined();
    expect(skill.inputModes).toBeUndefined();
    expect(skill.outputModes).toBeUndefined();
  });

  test('AgentCard should have all required fields according to spec', () => {
    const card: AgentCard = MINIMAL_AGENT_CARD;
    expect(card.name).toBe('TestAgent');
    expect(card.version).toBe('1.0');
    expect(card.url).toBe('http://example.com/agent');
    expect(card.authentication?.schemes).toEqual(['Bearer']);
    expect(card.skills.length).toBe(1);
    expect(card.skills[0].id).toBe('skill-123');
    expect(card.provider).toBeUndefined();
    expect(card.capabilities).toBeDefined();
    // defaultInputModes and defaultOutputModes are optional, may be undefined
    expect(card.defaultInputModes).toBeUndefined();
    expect(card.defaultOutputModes).toBeUndefined();
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
    expect(card.skills[0].description).toBe('Creates images from descriptions');
    expect(card.skills[0].tags).toEqual(['graphics', 'ai']);
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

  test('AgentCard should handle defaultInputModes and defaultOutputModes as optional', () => {
    // Omitted fields should be undefined
    const card = MINIMAL_AGENT_CARD;
    expect(card.defaultInputModes).toBeUndefined();
    expect(card.defaultOutputModes).toBeUndefined();

    // If present, should match provided values
    const cardWithDefaults: AgentCard = {
      ...MINIMAL_AGENT_CARD,
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['application/json']
    };
    expect(cardWithDefaults.defaultInputModes).toEqual(['text/plain']);
    expect(cardWithDefaults.defaultOutputModes).toEqual(['application/json']);
  });
});
