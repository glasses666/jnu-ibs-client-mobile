import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppShell } from '../components/AppShell.js';

const labels = {
  dashboard: 'Dashboard',
  trends: 'Trends',
  records: 'Records',
  settings: 'Settings',
  refresh: 'Refresh',
  balance: 'Balance',
  totalCost: 'Total Cost',
  subsidyLabel: 'Subsidy',
  rechargeRecords: 'Recharge Records',
  showMoney: 'Show Money',
  showUnit: 'Show Unit',
  electricity: 'Electricity',
  coldWater: 'Cold Water',
  hotWater: 'Hot Water',
  unitKwh: 'kWh',
  unitM3: 'm³',
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
  calcTitle: 'Recharge Assistant',
  calcDesc: 'Forecast recharge amount based on usage',
  roommates: 'Roommates',
  daysToCover: 'Days to Cover',
  generatePlan: 'Calculate Plan',
  configureAi: 'Configure AI in settings',
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

test('AppShell composes navigation, calculator modal, and main content for a logged-in session', () => {
  const html = renderToStaticMarkup(
    <AppShell
      labels={labels}
      room={overview.room}
      weather={null}
      isLoading={false}
      activeTab="overview"
      onSetActiveTab={() => {}}
      onRefresh={() => {}}
      onLogout={() => {}}
      isCalculatorOpen={false}
      balance={overview.balance}
      formatMoney={(value) => `¥${value.toFixed(2)}`}
      roommates={4}
      daysToCover={30}
      canCalculateRecharge={true}
      isCalcLoading={false}
      calcResult=""
      onCloseCalculator={() => {}}
      onRoommatesChange={() => {}}
      onDaysToCoverChange={() => {}}
      onCalculateRecharge={() => {}}
      overview={overview}
      dailyBrief="Remember to save energy."
      displayUnit="money"
      totalSubsidyMoney={24.13}
      balanceStatus={{
        textClass: 'text-white',
        statusText: 'Healthy',
        dotClass: 'bg-green-400',
      }}
      onSetDisplayUnit={() => {}}
      onOpenCalculator={() => {}}
      chartDate={new Date('2026-03-01T00:00:00Z')}
      chartData={[{ name: '3/28 (Est.)', elec: 6.7, cold: 0.7, hot: 0.2, isEstimate: true }]}
      isDark={false}
      enableAI={true}
      trendAnalysis=""
      isTrendAiLoading={false}
      onChangeMonth={() => {}}
      onGenerateAnalysis={() => {}}
      onResetAnalysis={() => {}}
      records={[]}
      lang="en"
      currency="CNY"
      aiProvider="google"
      apiKey="sk-demo"
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
    />
  );

  assert.match(html, /Dashboard/);
  assert.match(html, /T8201/);
  assert.match(html, /Remember to save energy/);
  assert.match(html, /Logout/);
});
