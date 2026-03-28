import React, { useState, useEffect } from 'react';
import { ibsService } from './services/ibsService';
import { aiService } from './services/geminiService';
import { weatherService, WeatherData } from './services/weatherService';
import { loadConfig, saveConfig, StorageKeys } from './services/storageService';
import { 
  OverviewData, 
  PaymentRecord, 
  MetricalDataResult, 
  Language,
  EnergyType,
  AIProvider
} from './types';
import { LABELS, API_BASE_URL } from './constants';
import { RefreshCw } from 'lucide-react';

// Add local interface for AI Config storage
interface AIConfig {
  enableAI: boolean;
  apiKey: string;
  baseUrl?: string;
  provider?: AIProvider;
  model?: string;
}

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
  type ActiveTab,
} from './components/AppNavigation';
import { isCloudAuthEnabled, supabase } from './services/supabaseClient';
import {
  formatMoney as formatCurrency,
  getBalanceStatus,
  getTotalSubsidyMoney,
  prepareTrendChartData,
} from './utils/dashboardPresentation';

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_OVERVIEW: OverviewData = {
  room: "T8201",
  balance: 124.50,
  costs: { elec: 85.20, cold: 24.50, hot: 12.00, total: 121.70 },
  subsidy: { elec: 15.50, cold: 5.00, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.10, hot: 0 },
  details: { elec: [131.60, 0.647], cold: [8.70, 2.82], hot: [0.48, 25.00] }
};

const MOCK_RECORDS: PaymentRecord[] = Array.from({ length: 15 }).map((_, i) => ({
  logTime: Date.now() - i * 86400000 * (Math.random() * 2 + 1),
  paymentType: i % 4 === 0 ? "微信充值" : "系统扣费",
  itemType: 2,
  dataValue: i % 4 === 0 ? 100.0 : -(Math.random() * 10 + 2)
}));

const generateMockTrends = (date = new Date()): MetricalDataResult[] => {
  const today = new Date();
  const isCurrentMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  const limitDay = isCurrentMonth ? Math.max(1, today.getDate() - 1) : daysInMonth;

  const generatePoints = (base: number, variance: number) => 
    Array.from({ length: limitDay }).map((_, i) => ({
      recordTime: new Date(date.getFullYear(), date.getMonth(), i + 1).getTime(),
      dataValue: parseFloat((base + Math.random() * variance).toFixed(2))
    }));

  return [
    { energyType: EnergyType.ELEC, datas: generatePoints(5, 3) },
    { energyType: EnergyType.COLD_WATER, datas: generatePoints(0.5, 0.3) },
    { energyType: EnergyType.HOT_WATER, datas: generatePoints(0.1, 0.1) }
  ];
};
// -------------------------------

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
  
  // App State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loginRoom, setLoginRoom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [trends, setTrends] = useState<MetricalDataResult[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [chartDate, setChartDate] = useState(new Date()); 

  // UI Toggles
  const [displayUnit, setDisplayUnit] = useState<'money' | 'unit'>('money'); 
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY'); 
  const [showCalculator, setShowCalculator] = useState(false); 

  // AI & Calculator State
  const [aiSummary, setAiSummary] = useState('');
  const [dailyBrief, setDailyBrief] = useState('');
  const [trendAnalysis, setTrendAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTrendAiLoading, setIsTrendAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [roommates, setRoommates] = useState(4);
  const [daysToCover, setDaysToCover] = useState(30); 
  const [calcResult, setCalcResult] = useState('');
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  
  // Cloud Auth State
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [showBinding, setShowBinding] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isConfigLoaded, setIsConfigLoaded] = useState(false); 
    const [customApiUrl, setCustomApiUrl] = useState('');
    const [showServerConfig, setShowServerConfig] = useState(false); 
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // New state for collapsing settings
  
    const t = LABELS[lang];
  // --- Initialization (Persistence) ---
  useEffect(() => {
    const init = async () => {
      const theme = await loadConfig(StorageKeys.THEME, 'light');
      setIsDark(theme === 'dark');
      
      const savedLang = await loadConfig(StorageKeys.LANG, Language.ZH);
      setLang(savedLang as Language);
      
      const aiConfig = await loadConfig<AIConfig>(StorageKeys.AI_CONFIG, { 
          enableAI: false, 
          apiKey: '',
          provider: 'google' 
      });
      
      if (aiConfig.apiKey) {
          setApiKey(aiConfig.apiKey);
          setEnableAI(aiConfig.enableAI);
          setAiProvider(aiConfig.provider || 'google');
          setAiBaseUrl(aiConfig.baseUrl || '');
          setAiModel(aiConfig.model || '');
      }
      const savedCurrency = await loadConfig<string>(StorageKeys.CURRENCY, 'CNY'); 
      setCurrency(savedCurrency as 'CNY' | 'USD');

      const savedApiUrl = await loadConfig<string>(StorageKeys.CUSTOM_API_URL, '');
      setCustomApiUrl(savedApiUrl);
      if (savedApiUrl) ibsService.setBaseUrl(savedApiUrl);

      setIsConfigLoaded(true); // All configurations loaded
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
      saveConfig(StorageKeys.AI_CONFIG, {
              enableAI, apiKey, baseUrl: aiBaseUrl, provider: aiProvider, model: aiModel 
          }); 
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
    if (aiProvider === 'google' && aiModel === 'qwen-plus') {
        setAiModel('gemini-2.5-flash');
    } else if (aiProvider === 'openai' && aiModel === 'gemini-2.5-flash') {
        setAiModel('qwen-plus');
    }
  }, [aiProvider]);

  // Trends Refresh
  useEffect(() => {
      if (isLoggedIn && !isDemo) {
          refreshTrendsOnly();
      } else if (isDemo) {
          setTrends(generateMockTrends(chartDate));
      }
  }, [chartDate]);

  // Trigger Daily Brief
  useEffect(() => {
      if (isConfigLoaded && overview && enableAI && apiKey && !dailyBrief) {
          aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
          aiService.generateDailyBrief(overview, lang, weather)
            .then(setDailyBrief)
            .catch(e => console.warn("Daily Brief Failed:", e));
      }
  }, [isConfigLoaded, overview, enableAI, apiKey, weather, lang, aiBaseUrl, aiProvider, aiModel, dailyBrief]);


  // --- Helpers ---
  const formatMoney = (amountInCNY: number) => formatCurrency(amountInCNY, currency);

  const totalSubsidyMoney = getTotalSubsidyMoney(overview?.subsidyMoney);
  
  const balanceStatus = getBalanceStatus(overview?.balance || 0, t);

  // --- Handlers ---
  const enterDemoMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsDemo(true);
      setIsLoggedIn(true);
      setOverview(MOCK_OVERVIEW);
      setRecords(MOCK_RECORDS);
      setTrends(generateMockTrends());
      setDailyBrief("☀️ 早安！又是元气满满的一天，记得节约用电哦~");
      setIsLoading(false);
    }, 800);
  };

  const handleLogin = async (e?: React.FormEvent, roomOverride?: string) => {
    if (e) e.preventDefault();
    const roomToUse = roomOverride || loginRoom;
    
    if (!roomToUse) return;
    if (roomToUse.toUpperCase() === 'DEMO') {
      enterDemoMode();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await ibsService.login(roomToUse);
      setIsLoggedIn(true);
      setIsDemo(false);
      // Ensure loginRoom state is consistent for other parts of app
      if (roomOverride) setLoginRoom(roomOverride);
      await loadData();
    } catch (err: any) {
      setErrorMsg(t.loginFail + ": " + (err.message || 'Unknown'));
      // If auto-login failed, stop the loading screen so user can retry
      setIsAutoLoggingIn(false); 
    } finally {
      setIsLoading(false);
      setIsAutoLoggingIn(false); // Stop welcome screen
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ov, rec, tr, wx] = await Promise.all([
        ibsService.fetchOverview(),
        ibsService.fetchRecords(1, 20),
        ibsService.fetchTrends(chartDate.getFullYear(), chartDate.getMonth()),
        weatherService.getWeather()
      ]);
      setOverview(ov);
      setRecords(rec);
      setTrends(tr);
      setWeather(wx);
    } catch (err) {
      console.error(err);
      setErrorMsg(t.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrendsOnly = async () => {
      if (isDemo) return;
      try {
          const tr = await ibsService.fetchTrends(chartDate.getFullYear(), chartDate.getMonth());
          setTrends(tr);
      } catch (e) {
          console.error("Failed to refresh trends", e);
      }
  };

  const handleRefresh = () => {
      if (isDemo) {
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 500);
          return;
      }
      loadData();
  };

  const handleAiSummary = async () => {
    if (!enableAI || !apiKey || !overview) return;
    
    setIsAiLoading(true);
    setAiError('');
    try {
      aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
      const summary = await aiService.generateSummary(overview, trends, lang);
      setAiSummary(summary);
    } catch (e: any) {
      setAiError(e.message || "Failed");
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const handleTrendAnalysis = async () => {
      if (!enableAI || !apiKey) {
          setActiveTab('settings');
          return;
      }
      setIsTrendAiLoading(true);
      try {
          aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
          const analysis = await aiService.generateTrendAnalysis(trends, lang);
          setTrendAnalysis(analysis);
      } catch (e: any) {
          console.error(e);
      } finally {
          setIsTrendAiLoading(false);
      }
  };

  const handleCalculateRecharge = async () => {
      if (!overview) return;
      setIsCalcLoading(true);
      setCalcResult('');
      
      try {
        aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
        
        // 1. Calculate Daily Avg Cost for each type
        const getDailyAvg = (typeId: number, defaultPrice: number) => {
            const trend = trends.find(t => Number(t.energyType) === typeId);
            if (!trend || trend.datas.length === 0) return 0;
            const recent = trend.datas.slice(-5);
            const avgUsage = recent.reduce((a, b) => a + b.dataValue, 0) / recent.length;
            return avgUsage * defaultPrice;
        };

        const dailyElec = getDailyAvg(2, 0.647);
        const dailyCold = getDailyAvg(3, 2.82);
        const dailyHot = getDailyAvg(4, 25.0);
        const totalDaily = dailyElec + dailyCold + dailyHot || (overview.costs.total / 30);

        const subElec = overview.subsidyMoney?.elec || 0;
        const subCold = overview.subsidyMoney?.cold || 0;
        const subHot = overview.subsidyMoney?.hot || 0;

        const sysPrompt = "You are a precise billing assistant.";
        const userPrompt = lang === Language.ZH 
            ? `请计算充值方案。注意：补贴是专款专用的（电补只能抵电费）。
               
               数据详情：
               1. ⚡ 电费: 日均消耗 ¥${dailyElec.toFixed(2)}, 剩余补贴 ¥${subElec.toFixed(2)}
               2. 💧 冷水: 日均消耗 ¥${dailyCold.toFixed(2)}, 剩余补贴 ¥${subCold.toFixed(2)}
               3. 🔥 热水: 日均消耗 ¥${dailyHot.toFixed(2)}, 剩余补贴 ¥${subHot.toFixed(2)}
               
               账户通用余额: ¥${overview.balance.toFixed(2)}
               目标天数: ${daysToCover}天
               宿舍人数: ${roommates}人
               
               计算逻辑:
               1. 分别计算每种资源的总需求 = 日均 * 天数。
               2. 每种资源的净需求 = MAX(0, 总需求 - 该资源的剩余补贴)。
               3. 总净需求 = 电净需求 + 冷净需求 + 热净需求。
               4. 最终需充值 = MAX(0, 总净需求 - 账户通用余额)。
               
               请输出 Markdown:
               - **需充值总额**: (向上取整到10元)
               - **人均**: (精确到分)
               - **分析**: 简述计算，提到各项补贴抵扣情况。
               - 📋 **文案**: 幽默催款。`
            : `Calculate recharge. Subsidies are specific to utility type.
               
               Data:
               1. Elec: Daily ¥${dailyElec.toFixed(2)}, Subsidy ¥${subElec.toFixed(2)}
               2. Cold: Daily ¥${dailyCold.toFixed(2)}, Subsidy ¥${subCold.toFixed(2)}
               3. Hot: Daily ¥${dailyHot.toFixed(2)}, Subsidy ¥${subHot.toFixed(2)}
               
               Main Balance: ¥${overview.balance.toFixed(2)}
               Days: ${daysToCover}
               
               Logic:
               NetNeed_Type = MAX(0, (Daily * Days) - Subsidy_Type)
               TotalNeed = Sum(NetNeed_Types) - MainBalance
               
               Output Markdown: Total, Per Person, Analysis, Message.`;

        const res = await aiService.ask(sysPrompt, userPrompt);
        setCalcResult(res);

      } catch (e: any) {
          setCalcResult("Error: " + e.message);
      } finally {
          setIsCalcLoading(false);
      }
  };

  const handleLogout = async () => {
      // Sign out from Supabase if logged in via cloud
      if (supabase) {
          await supabase.auth.signOut();
      }
      
      ibsService.logout();
      setIsLoggedIn(false);
      setIsDemo(false);
      setOverview(null);
      setRecords([]);
      setTrends([]);
      setAiSummary('');
      setDailyBrief('');
      setTrendAnalysis('');
      setAiError('');
      setLoginRoom('');
      setActiveTab('overview');
      setChartDate(new Date());
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(chartDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setChartDate(newDate);
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
                onBindSuccess={(roomId, nickname) => {
                    setShowBinding(false);
                    setUserName(nickname);
                    setIsAutoLoggingIn(true);
                    handleLogin(undefined, roomId);
                }}
            />
        );
    }

    if (showCloudAuth && isCloudAuthEnabled && supabase) {
        return (
            <CloudAuth 
                onLoginSuccess={async (user) => {
                    // Check if user has a bound room and get nickname
                    const { data, error } = await supabase
                        .from('user_bindings')
                        .select('room_id, nickname')
                        .eq('user_id', user.id)
                        .single();
                    
                    setShowCloudAuth(false);

                    if (data && data.room_id) {
                        setUserName(data.nickname || user.email?.split('@')[0] || 'User');
                        setIsAutoLoggingIn(true);
                        handleLogin(undefined, data.room_id);
                    } else {
                        // No binding, show binding screen
                        setCurrentUserId(user.id);
                        setShowBinding(true);
                    }
                }}
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
