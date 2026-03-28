import test from 'node:test';
import assert from 'node:assert/strict';

import { LABELS } from '../constants.js';
import { Language } from '../types.js';
import {
  createAppShellProps,
  createAuthShellProps,
} from '../utils/appShellProps.js';

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

const applyAction = <T>(action: T | ((current: T) => T), current: T) =>
  typeof action === 'function'
    ? (action as (value: T) => T)(current)
    : action;

test('createAuthShellProps maps signed-out state and wraps language/theme toggles', () => {
  let langAction: Language | ((current: Language) => Language) | undefined;
  let themeAction: boolean | ((current: boolean) => boolean) | undefined;
  let showCloudAuthValue: boolean | undefined;

  const props = createAuthShellProps({
    labels: LABELS.zh,
    apiBaseUrl: 'https://example.com/',
    isCloudAuthEnabled: true,
    canUseCloudAuth: true,
    isDark: false,
    customApiUrl: '',
    showServerConfig: false,
    session: {
      isLoggedIn: false,
      isLoading: false,
      isAutoLoggingIn: false,
      showBinding: false,
      showCloudAuth: false,
      userName: '',
      currentUserId: '',
      loginRoom: 'T8201',
      errorMsg: '',
    },
    setLang: (action) => {
      langAction = action;
    },
    setIsDark: (action) => {
      themeAction = action;
    },
    setShowCloudAuth: (value) => {
      showCloudAuthValue = value;
    },
    openServerConfig: () => {},
    closeServerConfig: () => {},
    setCustomApiUrl: () => {},
    setLoginRoom: () => {},
    handleLogin: () => {},
    enterDemoMode: () => {},
    handleBindingSuccess: () => {},
    handleCloudAuthSuccess: () => {},
  });

  assert.equal(props.loginRoom, 'T8201');
  props.onToggleLang();
  props.onToggleTheme();
  props.onShowCloudAuth();

  assert.equal(applyAction(langAction!, Language.ZH), Language.EN);
  assert.equal(applyAction(themeAction!, false), true);
  assert.equal(showCloudAuthValue, true);
});

test('createAppShellProps groups shell props and wraps preference callbacks', () => {
  let langValue: Language | undefined;
  let darkAction: boolean | ((current: boolean) => boolean) | undefined;
  let enableAiAction: boolean | ((current: boolean) => boolean) | undefined;
  let resetTrendValue: string | undefined;

  const props = createAppShellProps({
    labels: LABELS.en,
    canUseAiFeatures: true,
    preferences: {
      isDark: false,
      lang: Language.EN,
      enableAI: true,
      apiKey: 'sk-demo',
      aiBaseUrl: '',
      aiProvider: 'google',
      aiModel: 'gemini-2.5-flash',
      currency: 'CNY',
      customApiUrl: '',
      setLang: (value) => {
        langValue = value;
      },
      setIsDark: (action) => {
        darkAction = action;
      },
      setEnableAI: (action) => {
        enableAiAction = action;
      },
      setAiProvider: () => {},
      setApiKey: () => {},
      setAiModel: () => {},
      setAiBaseUrl: () => {},
      setCurrency: () => {},
      setCustomApiUrl: () => {},
    },
    session: {
      activeTab: 'overview',
      chartDate: new Date('2026-03-01T00:00:00Z'),
      dailyBrief: 'Remember to save energy.',
      isLoading: false,
      isTrendAiLoading: true,
      overview,
      records: [],
      trendAnalysis: '',
      weather: null,
    },
    sessionActions: {
      setActiveTab: () => {},
      handleRefresh: () => {},
      handleLogout: () => {},
      handleTrendAnalysis: () => {},
      setTrendAnalysis: (value) => {
        resetTrendValue = value;
      },
      changeMonth: () => {},
    },
    ui: {
      displayUnit: 'money',
      setDisplayUnit: () => {},
      showAdvancedSettings: false,
      toggleAdvancedSettings: () => {},
    },
    calculator: {
      showCalculator: false,
      openCalculator: () => {},
      closeCalculator: () => {},
      roommates: 4,
      setRoommates: () => {},
      daysToCover: 30,
      setDaysToCover: () => {},
      calcResult: '',
      isCalcLoading: false,
      handleCalculateRecharge: () => {},
    },
    derived: {
      formatMoney: (value) => `¥${value.toFixed(2)}`,
      totalSubsidyMoney: 24.13,
      balanceStatus: {
        textClass: 'text-white',
        statusText: 'Healthy',
        dotClass: 'bg-green-400',
      },
      chartData: [{ name: '3/28 (Est.)', elec: 6.7, cold: 0.7, hot: 0.2, isEstimate: true }],
    },
  });

  assert.equal(props.navigation.room, 'T8201');
  assert.equal(props.calculator.canCalculate, true);
  assert.equal(props.content.totalSubsidyMoney, 24.13);
  assert.equal(props.content.isTrendAiLoading, true);

  props.content.onSetLang('zh');
  props.content.onToggleDarkMode();
  props.content.onToggleAI();
  props.content.onResetAnalysis();

  assert.equal(langValue, Language.ZH);
  assert.equal(applyAction(darkAction!, false), true);
  assert.equal(applyAction(enableAiAction!, true), false);
  assert.equal(resetTrendValue, '');
});
