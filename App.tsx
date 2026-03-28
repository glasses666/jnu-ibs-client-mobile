import React, { useState, useEffect } from 'react';
import { ibsService } from './services/ibsService';
import { aiService } from './services/geminiService';
import { saveConfig, StorageKeys } from './services/storageService';
import { Language, AIProvider } from './types';
import { LABELS, API_BASE_URL } from './constants';
import { RefreshCw } from 'lucide-react';

import { CloudAuth } from './components/CloudAuth';
import { RoomBinding } from './components/RoomBinding';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { LoginScreen } from './components/LoginScreen';
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
import {
  createPersistedAiConfig,
  getCompatibleModelForProvider,
  loadPersistedPreferences,
} from './utils/appPreferences';
import { useAppSession } from './hooks/useAppSession';

const App: React.FC = () => {
  // --- State ---
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Language>(Language.ZH);
  
  // Settings State
  const [enableAI, setEnableAI] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('google');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');

  // UI Toggles
  const [displayUnit, setDisplayUnit] = useState<'money' | 'unit'>('money'); 
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY'); 
  const [showCalculator, setShowCalculator] = useState(false); 

  // AI & Calculator State
  const [roommates, setRoommates] = useState(4);
  const [daysToCover, setDaysToCover] = useState(30); 
  const [calcResult, setCalcResult] = useState('');
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  
  const [isConfigLoaded, setIsConfigLoaded] = useState(false); 
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false); 
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const t = LABELS[lang];
  // --- Initialization (Persistence) ---
  useEffect(() => {
    const init = async () => {
      const persisted = await loadPersistedPreferences();

      setIsDark(persisted.isDark);
      setLang(persisted.lang);
      setEnableAI(persisted.ai.enableAI);
      setApiKey(persisted.ai.apiKey);
      setAiProvider(persisted.ai.aiProvider);
      setAiBaseUrl(persisted.ai.aiBaseUrl);
      setAiModel(persisted.ai.aiModel);
      setCurrency(persisted.currency);
      setCustomApiUrl(persisted.customApiUrl);
      setIsConfigLoaded(true);
    };
    init();
  }, []);

  // Save config on changes
  useEffect(() => { saveConfig(StorageKeys.THEME, isDark ? 'dark' : 'light'); }, [isDark]);
  useEffect(() => { saveConfig(StorageKeys.LANG, lang); }, [lang]);
  useEffect(() => { saveConfig(StorageKeys.CURRENCY, currency); }, [currency]); 
  useEffect(() => { 
      saveConfig(StorageKeys.CUSTOM_API_URL, customApiUrl);
      ibsService.setBaseUrl(customApiUrl);
  }, [customApiUrl]);
  useEffect(() => { 
      saveConfig(StorageKeys.AI_CONFIG, createPersistedAiConfig({
        enableAI,
        apiKey,
        aiBaseUrl,
        aiProvider,
        aiModel,
      })); 
  }, [enableAI, apiKey, aiBaseUrl, aiProvider, aiModel]);

  // Apply Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle Provider Defaults
  useEffect(() => {
    setAiModel((current) => getCompatibleModelForProvider(aiProvider, current));
  }, [aiProvider]);

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

  // --- Render Login ---
  if (isAutoLoggingIn) {
      return <AuthLoadingScreen userName={userName} />;
  }

  if (!isLoggedIn) {
    if (showBinding) {
        return (
            <RoomBinding 
                userId={currentUserId}
                onBindSuccess={handleBindingSuccess}
            />
        );
    }

    if (showCloudAuth && isCloudAuthEnabled && supabase) {
        return (
            <CloudAuth 
                onLoginSuccess={handleCloudAuthSuccess}
                onAdminLogin={() => {
                    alert("管理员通道已激活");
                }}
            />
        );
    }

    return (
      <LoginScreen
        labels={t}
        apiBaseUrl={API_BASE_URL}
        isCloudAuthEnabled={isCloudAuthEnabled}
        isDark={isDark}
        isLoading={isLoading}
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
          
          <header className="hidden lg:flex justify-between items-end mb-10 pt-4">
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{t[activeTab]}</h2>
                <div className="flex items-center gap-3 mt-2">
                    <p className="text-gray-400 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {weather && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <span>{weather.place}</span>
                            <span>{weather.weather}</span>
                            <span>{weather.temperature}°C</span>
                        </div>
                    )}
                </div>
              </div>
              
              <button 
                onClick={handleRefresh}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-500 hover:text-primary border border-gray-100 dark:border-gray-700 shadow-sm transition-all"
              >
                  <RefreshCw size={18} className={`transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                  <span className="font-bold text-xs uppercase tracking-wider">{t.refresh}</span>
              </button>
          </header>

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
