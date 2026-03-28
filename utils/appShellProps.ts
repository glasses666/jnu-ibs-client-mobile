import type { Dispatch, SetStateAction } from 'react';

import { Language, type AIProvider } from '../types.js';
import type { AuthGateProps } from '../components/AuthGate.js';
import type { AppShellProps } from '../components/AppShell.js';
import type { BalanceStatus } from '../components/AppMainContent.js';
import type { SessionState } from './appSession.js';
import type { TrendChartDatum } from './dashboardPresentation.js';

type PreferencesArgs = {
  isDark: boolean;
  lang: Language;
  enableAI: boolean;
  apiKey: string;
  aiBaseUrl: string;
  aiProvider: AIProvider;
  aiModel: string;
  currency: 'CNY' | 'USD';
  customApiUrl: string;
  setLang: Dispatch<SetStateAction<Language>>;
  setIsDark: Dispatch<SetStateAction<boolean>>;
  setEnableAI: Dispatch<SetStateAction<boolean>>;
  setAiProvider: (value: AIProvider) => void;
  setApiKey: (value: string) => void;
  setAiModel: (value: string) => void;
  setAiBaseUrl: (value: string) => void;
  setCurrency: (value: 'CNY' | 'USD') => void;
  setCustomApiUrl: (value: string) => void;
};

type AuthShellSessionArgs = Pick<
  SessionState,
  | 'isLoggedIn'
  | 'isLoading'
  | 'isAutoLoggingIn'
  | 'showBinding'
  | 'showCloudAuth'
  | 'userName'
  | 'currentUserId'
  | 'loginRoom'
  | 'errorMsg'
>;

type AppShellSessionArgs = Pick<
  SessionState,
  | 'activeTab'
  | 'chartDate'
  | 'dailyBrief'
  | 'isLoading'
  | 'overview'
  | 'records'
  | 'trendAnalysis'
  | 'weather'
> & {
  isTrendAiLoading: boolean;
};

type AuthShellArgs = {
  labels: AuthGateProps['labels'];
  apiBaseUrl: string;
  isCloudAuthEnabled: boolean;
  canUseCloudAuth: boolean;
  isDark: boolean;
  customApiUrl: string;
  showServerConfig: boolean;
  session: AuthShellSessionArgs;
  setLang: Dispatch<SetStateAction<Language>>;
  setIsDark: Dispatch<SetStateAction<boolean>>;
  setShowCloudAuth: (value: boolean) => void;
  openServerConfig: () => void;
  closeServerConfig: () => void;
  setCustomApiUrl: (value: string) => void;
  setLoginRoom: (value: string) => void;
  handleLogin: AuthGateProps['onLogin'];
  enterDemoMode: () => void;
  handleBindingSuccess: AuthGateProps['onBindingSuccess'];
  handleCloudAuthSuccess: AuthGateProps['onCloudAuthSuccess'];
};

type SessionActionsArgs = {
  setActiveTab: AppShellProps['navigation']['onSetActiveTab'];
  handleRefresh: () => void;
  handleLogout: () => void;
  handleTrendAnalysis: () => void;
  setTrendAnalysis: (value: string) => void;
  changeMonth: (offset: number) => void;
};

type UiArgs = {
  displayUnit: 'money' | 'unit';
  setDisplayUnit: (value: 'money' | 'unit') => void;
  showAdvancedSettings: boolean;
  toggleAdvancedSettings: () => void;
};

type CalculatorArgs = {
  showCalculator: boolean;
  openCalculator: () => void;
  closeCalculator: () => void;
  roommates: number;
  setRoommates: (value: number) => void;
  daysToCover: number;
  setDaysToCover: (value: number) => void;
  calcResult: string;
  isCalcLoading: boolean;
  handleCalculateRecharge: () => void;
};

type DerivedArgs = {
  formatMoney: (value: number) => string;
  totalSubsidyMoney: number;
  balanceStatus: BalanceStatus;
  chartData: TrendChartDatum[];
};

type AppShellBuilderArgs = {
  labels: AppShellProps['labels'];
  canUseAiFeatures: boolean;
  preferences: PreferencesArgs;
  session: AppShellSessionArgs;
  sessionActions: SessionActionsArgs;
  ui: UiArgs;
  calculator: CalculatorArgs;
  derived: DerivedArgs;
};

export const createAuthShellProps = ({
  labels,
  apiBaseUrl,
  isCloudAuthEnabled,
  canUseCloudAuth,
  isDark,
  customApiUrl,
  showServerConfig,
  session,
  setLang,
  setIsDark,
  setShowCloudAuth,
  openServerConfig,
  closeServerConfig,
  setCustomApiUrl,
  setLoginRoom,
  handleLogin,
  enterDemoMode,
  handleBindingSuccess,
  handleCloudAuthSuccess,
}: AuthShellArgs): AuthGateProps => ({
  labels,
  apiBaseUrl,
  isLoggedIn: session.isLoggedIn,
  isCloudAuthEnabled,
  canUseCloudAuth,
  isDark,
  isLoading: session.isLoading,
  isAutoLoggingIn: session.isAutoLoggingIn,
  showBinding: session.showBinding,
  showCloudAuth: session.showCloudAuth,
  userName: session.userName,
  currentUserId: session.currentUserId,
  loginRoom: session.loginRoom,
  errorMsg: session.errorMsg,
  customApiUrl,
  showServerConfig,
  onToggleLang: () => setLang((current) => current === Language.ZH ? Language.EN : Language.ZH),
  onToggleTheme: () => setIsDark((current) => !current),
  onShowCloudAuth: () => setShowCloudAuth(true),
  onShowServerConfig: openServerConfig,
  onHideServerConfig: closeServerConfig,
  onCustomApiUrlChange: setCustomApiUrl,
  onLoginRoomChange: setLoginRoom,
  onLogin: handleLogin,
  onEnterDemoMode: enterDemoMode,
  onBindingSuccess: handleBindingSuccess,
  onCloudAuthSuccess: handleCloudAuthSuccess,
});

export const createAppShellProps = ({
  labels,
  canUseAiFeatures,
  preferences,
  session,
  sessionActions,
  ui,
  calculator,
  derived,
}: AppShellBuilderArgs): AppShellProps => ({
  labels,
  navigation: {
    room: session.overview?.room,
    weather: session.weather,
    isLoading: session.isLoading,
    activeTab: session.activeTab,
    onSetActiveTab: sessionActions.setActiveTab,
    onRefresh: sessionActions.handleRefresh,
    onLogout: sessionActions.handleLogout,
  },
  calculator: {
    isOpen: calculator.showCalculator,
    balance: session.overview?.balance || 0,
    formatMoney: derived.formatMoney,
    roommates: calculator.roommates,
    daysToCover: calculator.daysToCover,
    canCalculate: canUseAiFeatures,
    isCalcLoading: calculator.isCalcLoading,
    calcResult: calculator.calcResult,
    onClose: calculator.closeCalculator,
    onRoommatesChange: calculator.setRoommates,
    onDaysToCoverChange: calculator.setDaysToCover,
    onCalculate: calculator.handleCalculateRecharge,
  },
  content: {
    activeTab: session.activeTab,
    weather: session.weather,
    isLoading: session.isLoading,
    onRefresh: sessionActions.handleRefresh,
    overview: session.overview,
    dailyBrief: session.dailyBrief,
    displayUnit: ui.displayUnit,
    totalSubsidyMoney: derived.totalSubsidyMoney,
    balanceStatus: derived.balanceStatus,
    formatMoney: derived.formatMoney,
    onSetDisplayUnit: ui.setDisplayUnit,
    onOpenCalculator: calculator.openCalculator,
    chartDate: session.chartDate,
    chartData: derived.chartData,
    isDark: preferences.isDark,
    enableAI: preferences.enableAI,
    trendAnalysis: session.trendAnalysis,
    isTrendAiLoading: session.isTrendAiLoading,
    onChangeMonth: sessionActions.changeMonth,
    onGenerateAnalysis: sessionActions.handleTrendAnalysis,
    onResetAnalysis: () => sessionActions.setTrendAnalysis(''),
    records: session.records,
    lang: preferences.lang,
    currency: preferences.currency,
    aiProvider: preferences.aiProvider,
    apiKey: preferences.apiKey,
    aiModel: preferences.aiModel,
    aiBaseUrl: preferences.aiBaseUrl,
    showAdvancedSettings: ui.showAdvancedSettings,
    customApiUrl: preferences.customApiUrl,
    onSetLang: (value) => preferences.setLang(value === 'zh' ? Language.ZH : Language.EN),
    onToggleDarkMode: () => preferences.setIsDark((current) => !current),
    onSetCurrency: preferences.setCurrency,
    onToggleAI: () => preferences.setEnableAI((current) => !current),
    onSetAiProvider: preferences.setAiProvider,
    onSetApiKey: preferences.setApiKey,
    onSetAiModel: preferences.setAiModel,
    onSetAiBaseUrl: preferences.setAiBaseUrl,
    onToggleAdvancedSettings: ui.toggleAdvancedSettings,
    onSetCustomApiUrl: preferences.setCustomApiUrl,
    onLogout: sessionActions.handleLogout,
  },
});
