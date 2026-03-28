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

  if (!isLoggedIn) {
    return (
      <AppAuthShell
        labels={t}
        apiBaseUrl={API_BASE_URL}
        isLoggedIn={isLoggedIn}
        isCloudAuthEnabled={isCloudAuthEnabled}
        canUseCloudAuth={Boolean(supabase)}
        isDark={isDark}
        isLoading={isLoading}
        isAutoLoggingIn={isAutoLoggingIn}
        showBinding={showBinding}
        showCloudAuth={showCloudAuth}
        userName={userName}
        currentUserId={currentUserId}
        loginRoom={loginRoom}
        errorMsg={errorMsg}
        customApiUrl={customApiUrl}
        showServerConfig={showServerConfig}
        onToggleLang={() => setLang((current) => current === Language.ZH ? Language.EN : Language.ZH)}
        onToggleTheme={() => setIsDark(!isDark)}
        onShowCloudAuth={() => setShowCloudAuth(true)}
        onShowServerConfig={openServerConfig}
        onHideServerConfig={closeServerConfig}
        onCustomApiUrlChange={setCustomApiUrl}
        onLoginRoomChange={setLoginRoom}
        onLogin={handleLogin}
        onEnterDemoMode={enterDemoMode}
        onBindingSuccess={handleBindingSuccess}
        onCloudAuthSuccess={handleCloudAuthSuccess}
      />
    );
  }

  // --- Main App Layout ---
  return (
    <AppShell
      labels={t}
      navigation={{
        room: overview?.room,
        weather,
        isLoading,
        activeTab,
        onSetActiveTab: setActiveTab,
        onRefresh: handleRefresh,
        onLogout: handleLogout,
      }}
      calculator={{
        isOpen: showCalculator,
        balance: overview?.balance || 0,
        formatMoney,
        roommates,
        daysToCover,
        canCalculate: canUseAiFeatures,
        isCalcLoading,
        calcResult,
        onClose: closeCalculator,
        onRoommatesChange: setRoommates,
        onDaysToCoverChange: setDaysToCover,
        onCalculate: handleCalculateRecharge,
      }}
      content={{
        activeTab,
        weather,
        isLoading,
        onRefresh: handleRefresh,
        overview,
        dailyBrief,
        displayUnit,
        totalSubsidyMoney,
        balanceStatus,
        formatMoney,
        onSetDisplayUnit: setDisplayUnit,
        onOpenCalculator: openCalculator,
        chartDate,
        chartData,
        isDark,
        enableAI,
        trendAnalysis,
        isTrendAiLoading,
        onChangeMonth: changeMonth,
        onGenerateAnalysis: handleTrendAnalysis,
        onResetAnalysis: () => setTrendAnalysis(''),
        records,
        lang,
        currency,
        aiProvider,
        apiKey,
        aiModel,
        aiBaseUrl,
        showAdvancedSettings,
        customApiUrl,
        onSetLang: (value) => setLang(value === 'zh' ? Language.ZH : Language.EN),
        onToggleDarkMode: () => setIsDark(!isDark),
        onSetCurrency: setCurrency,
        onToggleAI: () => setEnableAI(!enableAI),
        onSetAiProvider: setAiProvider,
        onSetApiKey: setApiKey,
        onSetAiModel: setAiModel,
        onSetAiBaseUrl: setAiBaseUrl,
        onToggleAdvancedSettings: toggleAdvancedSettings,
        onSetCustomApiUrl: setCustomApiUrl,
        onLogout: handleLogout,
      }}
    />
  );
};

export default App;
