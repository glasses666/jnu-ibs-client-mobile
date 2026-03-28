import React from 'react';
import { Language } from './types';
import { LABELS, API_BASE_URL } from './constants';

import { AppAuthShell } from './components/AppAuthShell';
import { AppShell } from './components/AppShell';
import { isCloudAuthEnabled, supabase } from './services/supabaseClient';
import {
  formatMoney as formatCurrency,
  getBalanceStatus,
  getTotalSubsidyMoney,
  prepareTrendChartData,
} from './utils/dashboardPresentation';
import { useAppSession } from './hooks/useAppSession';
import { useAppPreferences } from './hooks/useAppPreferences';
import { useAppUiState } from './hooks/useAppUiState';
import { useRechargeCalculator } from './hooks/useRechargeCalculator';
import { createAppShellProps, createAuthShellProps } from './utils/appShellProps';
import { isAiFeatureConfigured } from './utils/appPreferences';

const App: React.FC = () => {
  const {
    isDark,
    setIsDark,
    lang,
    setLang,
    enableAI,
    setEnableAI,
    apiKey,
    setApiKey,
    aiBaseUrl,
    setAiBaseUrl,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    currency,
    setCurrency,
    customApiUrl,
    setCustomApiUrl,
    isConfigLoaded,
  } = useAppPreferences();

  const t = LABELS[lang];
  const {
    displayUnit,
    setDisplayUnit,
    showServerConfig,
    openServerConfig,
    closeServerConfig,
    showAdvancedSettings,
    toggleAdvancedSettings,
  } = useAppUiState();
  const canUseAiFeatures = isAiFeatureConfigured({
    enableAI,
    apiKey,
    aiBaseUrl,
    aiProvider,
  });

  const {
    session: {
      activeTab,
      chartDate,
      currentUserId,
      dailyBrief,
      errorMsg,
      isAutoLoggingIn,
      isLoading,
      isLoggedIn,
      loginRoom,
      overview,
      records,
      showBinding,
      showCloudAuth,
      trendAnalysis,
      trends,
      userName,
      weather,
    },
    isTrendAiLoading,
    setActiveTab,
    setLoginRoom,
    setShowCloudAuth,
    setTrendAnalysis,
    changeMonth,
    enterDemoMode,
    handleLogin,
    handleRefresh,
    handleTrendAnalysis,
    handleLogout,
    handleBindingSuccess,
    handleCloudAuthSuccess,
  } = useAppSession({
    labels: {
      loginFail: t.loginFail,
      networkError: t.networkError,
    },
    lang,
    ai: {
      isConfigLoaded,
      isConfigured: canUseAiFeatures,
      enableAI,
      apiKey,
      aiBaseUrl,
      aiProvider,
      aiModel,
    },
  });

  // --- Helpers ---
  const formatMoney = (amountInCNY: number) => formatCurrency(amountInCNY, currency);

  const totalSubsidyMoney = getTotalSubsidyMoney(overview?.subsidyMoney);

  const balanceStatus = getBalanceStatus(overview?.balance || 0, t);

  const chartData = prepareTrendChartData({
    trends,
    chartDate,
    lang,
    estimatedTodayLabel: t.estimatedToday,
  });
  const {
    showCalculator,
    openCalculator,
    closeCalculator,
    roommates,
    setRoommates,
    daysToCover,
    setDaysToCover,
    calcResult,
    isCalcLoading,
    handleCalculateRecharge,
  } = useRechargeCalculator({
    canUseAiFeatures,
    ai: {
      apiKey,
      aiBaseUrl,
      aiProvider,
      aiModel,
    },
    lang,
    overview,
    trends,
  });

  const authShellProps = createAuthShellProps({
    labels: t,
    apiBaseUrl: API_BASE_URL,
    isCloudAuthEnabled,
    canUseCloudAuth: Boolean(supabase),
    isDark,
    customApiUrl,
    showServerConfig,
    session: {
      isLoggedIn,
      isLoading,
      isAutoLoggingIn,
      showBinding,
      showCloudAuth,
      userName,
      currentUserId,
      loginRoom,
      errorMsg,
    },
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
  });

  const appShellProps = createAppShellProps({
    labels: t,
    canUseAiFeatures,
    preferences: {
      isDark,
      lang,
      enableAI,
      apiKey,
      aiBaseUrl,
      aiProvider,
      aiModel,
      currency,
      customApiUrl,
      setLang,
      setIsDark,
      setEnableAI,
      setAiProvider,
      setApiKey,
      setAiModel,
      setAiBaseUrl,
      setCurrency,
      setCustomApiUrl,
    },
    session: {
      activeTab,
      chartDate,
      dailyBrief,
      isLoading,
      isTrendAiLoading,
      overview,
      records,
      trendAnalysis,
      weather,
    },
    sessionActions: {
      setActiveTab,
      handleRefresh,
      handleLogout,
      handleTrendAnalysis,
      setTrendAnalysis,
      changeMonth,
    },
    ui: {
      displayUnit,
      setDisplayUnit,
      showAdvancedSettings,
      toggleAdvancedSettings,
    },
    calculator: {
      showCalculator,
      openCalculator,
      closeCalculator,
      roommates,
      setRoommates,
      daysToCover,
      setDaysToCover,
      calcResult,
      isCalcLoading,
      handleCalculateRecharge,
    },
    derived: {
      formatMoney,
      totalSubsidyMoney,
      balanceStatus,
      chartData,
    },
  });

  if (!isLoggedIn) {
    return <AppAuthShell {...authShellProps} />;
  }

  // --- Main App Layout ---
  return <AppShell {...appShellProps} />;
};

export default App;
