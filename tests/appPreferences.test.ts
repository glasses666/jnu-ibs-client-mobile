import test from 'node:test';
import assert from 'node:assert/strict';

import { Language } from '../types.js';
import {
  createPersistedAiConfig,
  getCompatibleModelForProvider,
  hydratePersistedPreferences,
  isAiFeatureConfigured,
} from '../utils/appPreferences.js';

test('getCompatibleModelForProvider keeps the existing google fallback mapping', () => {
  assert.equal(getCompatibleModelForProvider('google', 'qwen-plus'), 'gemini-2.5-flash');
  assert.equal(getCompatibleModelForProvider('openai', 'gemini-2.5-flash'), 'qwen-plus');
  assert.equal(getCompatibleModelForProvider('google', 'gemini-2.5-flash'), 'gemini-2.5-flash');
});

test('hydratePersistedPreferences maps storage values into app state defaults', () => {
  const hydrated = hydratePersistedPreferences({
    theme: 'dark',
    lang: Language.EN,
    currency: 'USD',
    customApiUrl: 'https://proxy.example.com',
    aiConfig: {
      enableAI: true,
      apiKey: 'sk-demo',
      provider: 'openai',
      baseUrl: 'https://openai-proxy.example.com',
      model: 'qwen-plus',
    },
  });

  assert.equal(hydrated.isDark, true);
  assert.equal(hydrated.lang, Language.EN);
  assert.equal(hydrated.currency, 'USD');
  assert.equal(hydrated.customApiUrl, 'https://proxy.example.com');
  assert.deepEqual(hydrated.ai, {
    enableAI: true,
    apiKey: 'sk-demo',
    aiProvider: 'openai',
    aiBaseUrl: 'https://openai-proxy.example.com',
    aiModel: 'qwen-plus',
  });
});

test('createPersistedAiConfig returns the storage payload shape used by App', () => {
  assert.deepEqual(
    createPersistedAiConfig({
      enableAI: true,
      apiKey: 'sk-demo',
      aiBaseUrl: 'https://proxy.example.com',
      aiProvider: 'openai',
      aiModel: 'qwen-plus',
    }),
    {
      enableAI: true,
      apiKey: 'sk-demo',
      baseUrl: 'https://proxy.example.com',
      provider: 'openai',
      model: 'qwen-plus',
    }
  );
});

test('isAiFeatureConfigured requires an API key before enabling AI actions', () => {
  assert.equal(
    isAiFeatureConfigured({
      enableAI: true,
      apiKey: '',
      aiProvider: 'google',
      aiBaseUrl: '',
    }),
    false
  );
  assert.equal(
    isAiFeatureConfigured({
      enableAI: false,
      apiKey: 'sk-demo',
      aiProvider: 'google',
      aiBaseUrl: '',
    }),
    false
  );
  assert.equal(
    isAiFeatureConfigured({
      enableAI: true,
      apiKey: 'sk-demo',
      aiProvider: 'google',
      aiBaseUrl: '',
    }),
    true
  );
});

test('isAiFeatureConfigured requires a base url for openai-compatible providers', () => {
  assert.equal(
    isAiFeatureConfigured({
      enableAI: true,
      apiKey: 'sk-demo',
      aiProvider: 'openai',
      aiBaseUrl: '',
    }),
    false
  );
  assert.equal(
    isAiFeatureConfigured({
      enableAI: true,
      apiKey: 'sk-demo',
      aiProvider: 'openai',
      aiBaseUrl: 'https://proxy.example.com/v1',
    }),
    true
  );
});
