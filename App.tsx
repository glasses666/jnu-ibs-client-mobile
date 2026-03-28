import React, { useState } from 'react';
import { aiService } from './services/geminiService';
import { Language } from './types';
import { LABELS, API_BASE_URL } from './constants';

import { AuthGate } from './components/AuthGate';
import { DesktopPageHeader } from './components/DesktopPageHeader';
import { RechargeCalculatorModal } from './components/RechargeCalculatorModal';
import { SettingsPanel } from './components/SettingsPanel';
import { OverviewContent } from './components/OverviewContent';
import { RecordsPanel } from './components/RecordsPanel';
import { TrendsPanel } from './components/TrendsPanel';
import {
  DesktopSidebar,
  MobileBottomNav,
  MobileHeader,
} from './components/AppNavigation';
import { isCloudAuthEnabled, supabase } from './services/supabaseClient';
import {
  formatMoney as formatCurrency,
  getBalanceStatus,
  getTotalSubsidyMoney,
  prepareTrendChartData,
} from './utils/dashboardPresentation';
import {
  calculateRechargePlanInputs,
  createRechargePrompt,
} from './utils/rechargePlanner';
import { useAppSession } from './hooks/useAppSession';
import { useAppPreferences } from './hooks/useAppPreferences';

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
      if (!overview) return;
      setIsCalcLoading(true);
      setCalcResult('');
      
      try {
        aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
        const planInputs = calculateRechargePlanInputs({
          overview,
          trends,
          daysToCover,
          roommates,
        });
        const { systemPrompt, userPrompt } = createRechargePrompt({
          lang,
          inputs: planInputs,
        });
        const res = await aiService.ask(systemPrompt, userPrompt);
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
    <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] dark:bg-black text-gray-900 dark:text-gray-100 transition-colors overflow-hidden font-sans selection:bg-primary/20">
      
      <RechargeCalculatorModal
        isOpen={showCalculator}
        labels={t}
        balance={overview?.balance || 0}
        formatMoney={formatMoney}
        roommates={roommates}
        daysToCover={daysToCover}
        enableAI={enableAI}
        isCalcLoading={isCalcLoading}
        calcResult={calcResult}
        onClose={() => setShowCalculator(false)}
        onRoommatesChange={setRoommates}
        onDaysToCoverChange={setDaysToCover}
        onCalculate={handleCalculateRecharge}
      />

      <DesktopSidebar
        labels={t}
        room={overview?.room}
        activeTab={activeTab}
        onSetActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <MobileHeader
        room={overview?.room}
        weather={weather}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <main className="flex-1 lg:pl-80 pt-14 lg:pt-0 pb-28 lg:pb-8 overflow-y-auto no-scrollbar">
        <div className="p-5 md:p-10 max-w-6xl mx-auto min-h-full">
          <DesktopPageHeader
            title={t[activeTab]}
            refreshLabel={t.refresh}
            isLoading={isLoading}
            weather={weather}
            onRefresh={handleRefresh}
          />

          {activeTab === 'overview' && (
              <OverviewContent
                labels={t}
                overview={overview}
                dailyBrief={dailyBrief}
                displayUnit={displayUnit}
                totalSubsidyMoney={totalSubsidyMoney}
                balanceStatus={balanceStatus}
                formatMoney={formatMoney}
                onSetDisplayUnit={setDisplayUnit}
                onOpenCalculator={() => setShowCalculator(true)}
                onRefresh={handleRefresh}
              />
          )}

          {activeTab === 'trends' && (
              <TrendsPanel
                labels={t}
                chartDate={chartDate}
                chartData={chartData}
                isDark={isDark}
                enableAI={enableAI}
                trendAnalysis={trendAnalysis}
                isTrendAiLoading={isTrendAiLoading}
                onChangeMonth={changeMonth}
                onGenerateAnalysis={handleTrendAnalysis}
                onResetAnalysis={() => setTrendAnalysis('')}
              />
          )}

          {activeTab === 'records' && (
              <RecordsPanel
                labels={t}
                records={records}
                formatMoney={formatMoney}
              />
          )}

          {activeTab === 'settings' && (
              <SettingsPanel
                labels={t}
                lang={lang}
                isDark={isDark}
                currency={currency}
                enableAI={enableAI}
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
                onLogout={handleLogout}
              />
          )}

        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} onSetActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
