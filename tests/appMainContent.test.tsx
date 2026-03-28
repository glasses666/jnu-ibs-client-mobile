import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppMainContent } from '../components/AppMainContent.js';

const labels = {
  dashboard: 'Dashboard',
  trends: 'Trends',
  records: 'Records',
  settings: 'Settings',
  refresh: 'Refresh',
  balance: 'Balance',
  totalCost: 'Total Cost',
  subsidyLabel: 'Subsidy',
  showMoney: 'Show Money',
  showUnit: 'Show Unit',
  electricity: 'Electricity',
  coldWater: 'Cold Water',
  hotWater: 'Hot Water',
  unitKwh: 'kWh',
  unitM3: 'm³',
  rechargeRecords: 'Recharge Records',
  estimatedToday: 'Today (Est.)',
  trendAnalysisTitle: 'AI Trend Analysis',
  generateAnalysis: 'Generate',
  analysisNotEnabled: 'AI Disabled',
  analysisPlaceholder: 'Generate an analysis for the current chart.',
  regenerate: 'Regenerate',
  general: 'General',
  language: 'Language',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  currencyLabel: 'Currency',
  aiConfig: 'AI Config',
  betaTag: 'Beta',
  aiProvider: 'AI Provider',
  apiKeyPlaceholder: 'API Key',
  modelName: 'Model',
  modelPlaceholder: 'Model name',
  apiUrlPlaceholder: 'Base URL',
  baseUrlHint: 'Base URL hint',
  logout: 'Logout',
};

const overview = {
  room: 'T8201',
  balance: 124.5,
  costs: { elec: 85.2, cold: 24.5, hot: 12, total: 121.7 },
  subsidy: { elec: 15.5, cold: 5, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.1, hot: 0 },
  details: {
    elec: [131.6, 0.647] as [number, number],
    cold: [8.7, 2.82] as [number, number],
    hot: [0.48, 25] as [number, number],
  },
};

const baseProps = {
  labels,
  isDark: false,
  isLoading: false,
  weather: null,
  activeTab: 'overview' as const,
  overview,
  dailyBrief: 'Remember to save energy.',
  displayUnit: 'money' as const,
  totalSubsidyMoney: 24.13,
  balanceStatus: {
    textClass: 'text-white',
    statusText: 'Healthy',
    dotClass: 'bg-green-400',
  },
  formatMoney: (value: number) => `¥${value.toFixed(2)}`,
  records: [],
  chartDate: new Date('2026-03-01T00:00:00Z'),
  chartData: [{ name: '3/28 (Est.)', elec: 6.7, cold: 0.7, hot: 0.2, isEstimate: true }],
  enableAI: true,
  trendAnalysis: '',
  isTrendAiLoading: false,
  lang: 'en' as const,
  currency: 'CNY' as const,
  aiProvider: 'google' as const,
  apiKey: 'sk-demo',
  aiModel: 'gemini-2.5-flash',
  aiBaseUrl: '',
  showAdvancedSettings: false,
  customApiUrl: '',
  onRefresh: () => {},
  onSetDisplayUnit: () => {},
  onOpenCalculator: () => {},
  onChangeMonth: () => {},
  onGenerateAnalysis: () => {},
  onResetAnalysis: () => {},
  onSetLang: () => {},
  onToggleDarkMode: () => {},
  onSetCurrency: () => {},
  onToggleAI: () => {},
  onSetAiProvider: () => {},
  onSetApiKey: () => {},
  onSetAiModel: () => {},
  onSetAiBaseUrl: () => {},
  onToggleAdvancedSettings: () => {},
  onSetCustomApiUrl: () => {},
  onLogout: () => {},
};

test('AppMainContent renders the overview tab with the desktop header', () => {
  const html = renderToStaticMarkup(<AppMainContent {...baseProps} />);

  assert.match(html, /Dashboard/);
  assert.match(html, /Remember to save energy/);
  assert.match(html, /Refresh/);
});

test('AppMainContent switches to the settings panel when the settings tab is active', () => {
  const html = renderToStaticMarkup(
    <AppMainContent
      {...baseProps}
      activeTab="settings"
    />
  );

  assert.match(html, /AI Config/);
  assert.match(html, /General/);
  assert.doesNotMatch(html, /Remember to save energy/);
});
