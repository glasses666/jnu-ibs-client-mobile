import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAppConfig,
  normalizeBaseUrl,
} from '../config/appConfig.js';

test('normalizeBaseUrl trims whitespace and guarantees a trailing slash', () => {
  assert.equal(
    normalizeBaseUrl(' https://example.com/custom/path '),
    'https://example.com/custom/path/'
  );
});

test('createAppConfig falls back to the default IBS API base url', () => {
  const config = createAppConfig({});

  assert.equal(
    config.apiBaseUrl,
    'https://pynhcx.jnu.edu.cn/IBSjnuweb/WebService/JNUService.asmx/'
  );
});

test('createAppConfig disables cloud auth when Supabase values are missing', () => {
  const config = createAppConfig({
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
  });

  assert.equal(config.cloudAuthEnabled, false);
});

test('createAppConfig enables cloud auth when Supabase values are present', () => {
  const config = createAppConfig({
    VITE_SUPABASE_URL: 'https://demo.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon-key',
  });

  assert.equal(config.cloudAuthEnabled, true);
});
