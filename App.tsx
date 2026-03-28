import React, { useState } from 'react';
import { aiService } from './services/geminiService';
import { Language } from './types';
import { LABELS, API_BASE_URL } from './constants';

import { AuthGate } from './components/AuthGate';
import { AppShell } from './components/AppShell';
import { isCloudAuthEnabled, supabase } from './services/supabaseClient';
import {
  formatMoney as formatCurrency,
  getBalanceStatus,
  getTotalSubsidyMoney,
  prepareTrendChartData,
} from './utils/dashboardPresentation';
import {
  generateRechargePlan,
} from './utils/rechargePlanner';
import { useAppSession } from './hooks/useAppSession';
import { useAppPreferences } from './hooks/useAppPreferences';
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

  // UI Toggles
  const [displayUnit, setDisplayUnit] = useState<'money' | 'unit'>('money'); 
  const [showCalculator, setShowCalculator] = useState(false); 

  // AI & Calculator State
  const [roommates, setRoommates] = useState(4);
  const [daysToCover, setDaysToCover] = useState(30); 
  const [calcResult, setCalcResult] = useState('');
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  
  const [showServerConfig, setShowServerConfig] = useState(false); 
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const t = LABELS[lang];
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

  // --- Handlers ---
  const handleCalculateRecharge = async () => {
      if (!overview || !canUseAiFeatures) return;
      setIsCalcLoading(true);
      setCalcResult('');
      
      try {
        const res = await generateRechargePlan({
          aiClient: aiService,
          ai: {
            apiKey,
            aiBaseUrl,
            aiProvider,
            aiModel,
          },
          lang,
          overview,
          trends,
          daysToCover,
          roommates,
        });
        setCalcResult(res);

      } catch (e: any) {
          setCalcResult("Error: " + e.message);
      } finally {
          setIsCalcLoading(false);
      }
  };

  const chartData = prepareTrendChartData({
    trends,
    chartDate,
    lang,
    estimatedTodayLabel: t.estimatedToday,
  });

  if (!isLoggedIn) {
    return (
      <AuthGate
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
        onShowServerConfig={() => setShowServerConfig(true)}
        onHideServerConfig={() => setShowServerConfig(false)}
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
      room={overview?.room}
      weather={weather}
      isLoading={isLoading}
      activeTab={activeTab}
      onSetActiveTab={setActiveTab}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
      isCalculatorOpen={showCalculator}
      balance={overview?.balance || 0}
      formatMoney={formatMoney}
      roommates={roommates}
      daysToCover={daysToCover}
      canCalculateRecharge={canUseAiFeatures}
      isCalcLoading={isCalcLoading}
      calcResult={calcResult}
      onCloseCalculator={() => setShowCalculator(false)}
      onRoommatesChange={setRoommates}
      onDaysToCoverChange={setDaysToCover}
      onCalculateRecharge={handleCalculateRecharge}
      overview={overview}
      dailyBrief={dailyBrief}
      displayUnit={displayUnit}
      totalSubsidyMoney={totalSubsidyMoney}
      balanceStatus={balanceStatus}
      onSetDisplayUnit={setDisplayUnit}
      onOpenCalculator={() => setShowCalculator(true)}
      chartDate={chartDate}
      chartData={chartData}
      isDark={isDark}
      enableAI={enableAI}
      trendAnalysis={trendAnalysis}
      isTrendAiLoading={isTrendAiLoading}
      onChangeMonth={changeMonth}
      onGenerateAnalysis={handleTrendAnalysis}
      onResetAnalysis={() => setTrendAnalysis('')}
      records={records}
      lang={lang}
      currency={currency}
      aiProvider={aiProvider}
      apiKey={apiKey}
      aiModel={aiModel}
      aiBaseUrl={aiBaseUrl}
      showAdvancedSettings={showAdvancedSettings}
      customApiUrl={customApiUrl}
      onSetLang={(value) => setLang(value === 'zh' ? Language.ZH : Language.EN)}
      onToggleDarkMode={() => setIsDark(!isDark)}
      onSetCurrency={setCurrency}
      onToggleAI={() => setEnableAI(!enableAI)}
      onSetAiProvider={setAiProvider}
      onSetApiKey={setApiKey}
      onSetAiModel={setAiModel}
      onSetAiBaseUrl={setAiBaseUrl}
      onToggleAdvancedSettings={() => setShowAdvancedSettings(!showAdvancedSettings)}
      onSetCustomApiUrl={setCustomApiUrl}
    />
  );
};

export default App;
