import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SettingsPanel } from '../components/SettingsPanel.js';

const labels = {
  general: '通用',
  language: '语言',
  darkMode: '暗黑模式',
  lightMode: '明亮模式',
  currencyLabel: '货币单位',
  aiConfig: 'AI 配置',
  betaTag: 'Beta',
  aiProvider: 'AI 提供商',
  apiKeyPlaceholder: 'API Key',
  modelName: '模型名称',
  modelPlaceholder: '例如: qwen-plus, gemini-2.5-flash',
  apiUrlPlaceholder: 'API Base URL',
  baseUrlHint: 'For OpenAI Compatible, enter the Base URL (excluding /chat/completions)',
  logout: '退出',
};

test('SettingsPanel hides AI detail fields when AI is disabled', () => {
  const html = renderToStaticMarkup(
    <SettingsPanel
      labels={labels}
      lang="zh"
      isDark={false}
      currency="CNY"
      enableAI={false}
      aiProvider="google"
      apiKey=""
      aiModel="gemini-2.5-flash"
      aiBaseUrl=""
      showAdvancedSettings={false}
      customApiUrl=""
      onSetLang={() => {}}
      onToggleDarkMode={() => {}}
      onSetCurrency={() => {}}
      onToggleAI={() => {}}
      onSetAiProvider={() => {}}
      onSetApiKey={() => {}}
      onSetAiModel={() => {}}
      onSetAiBaseUrl={() => {}}
      onToggleAdvancedSettings={() => {}}
      onSetCustomApiUrl={() => {}}
      onLogout={() => {}}
    />
  );

  assert.doesNotMatch(html, /API Key/);
  assert.match(html, /通用/);
});

test('SettingsPanel shows the OpenAI base url hint when the OpenAI provider is selected', () => {
  const html = renderToStaticMarkup(
    <SettingsPanel
      labels={labels}
      lang="en"
      isDark={true}
      currency="USD"
      enableAI={true}
      aiProvider="openai"
      apiKey="sk-demo"
      aiModel="qwen-plus"
      aiBaseUrl="https://example.com"
      showAdvancedSettings={false}
      customApiUrl=""
      onSetLang={() => {}}
      onToggleDarkMode={() => {}}
      onSetCurrency={() => {}}
      onToggleAI={() => {}}
      onSetAiProvider={() => {}}
      onSetApiKey={() => {}}
      onSetAiModel={() => {}}
      onSetAiBaseUrl={() => {}}
      onToggleAdvancedSettings={() => {}}
      onSetCustomApiUrl={() => {}}
      onLogout={() => {}}
    />
  );

  assert.match(html, /OpenAI Compatible/);
  assert.match(html, /Base URL/);
  assert.match(html, /excluding \/chat\/completions/);
});

test('SettingsPanel renders the advanced custom server input when expanded', () => {
  const html = renderToStaticMarkup(
    <SettingsPanel
      labels={labels}
      lang="zh"
      isDark={false}
      currency="CNY"
      enableAI={false}
      aiProvider="google"
      apiKey=""
      aiModel="gemini-2.5-flash"
      aiBaseUrl=""
      showAdvancedSettings={true}
      customApiUrl="https://proxy.example.com"
      onSetLang={() => {}}
      onToggleDarkMode={() => {}}
      onSetCurrency={() => {}}
      onToggleAI={() => {}}
      onSetAiProvider={() => {}}
      onSetApiKey={() => {}}
      onSetAiModel={() => {}}
      onSetAiBaseUrl={() => {}}
      onToggleAdvancedSettings={() => {}}
      onSetCustomApiUrl={() => {}}
      onLogout={() => {}}
    />
  );

  assert.match(html, /Custom Server URL/);
  assert.match(html, /https:\/\/proxy\.example\.com/);
});
