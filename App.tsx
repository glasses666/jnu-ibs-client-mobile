import React, { useState, useEffect, useCallback } from 'react';
import { ibsService } from './services/ibsService';
import { aiService } from './services/geminiService';
import { weatherService, WeatherData } from './services/weatherService';
import { loadConfig, saveConfig, StorageKeys } from './services/storageService';
import { Capacitor } from '@capacitor/core';
import { 
  JNUResponse, 
  OverviewData, 
  PaymentRecord, 
  MetricalDataResult, 
  Language,
  EnergyType,
  AIProvider
} from './types';
import { LABELS, API_BASE_URL } from './constants';
import DataCard from './components/DataCard';

// Add local interface for AI Config storage
interface AIConfig {
  enableAI: boolean;
  apiKey: string;
  baseUrl?: string;
  provider?: AIProvider;
  model?: string;
}

import { CountUp } from './components/CountUp';
import { MarkdownText } from './components/MarkdownText';
import { CloudAuth } from './components/CloudAuth';
import { RoomBinding } from './components/RoomBinding';
import { supabase } from './services/supabaseClient';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Icons
import { 
  Wallet, 
  Zap, 
  Droplet, 
  Flame, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Activity, 
  History, 
  LayoutDashboard,
  BrainCircuit,
  Globe,
  Home,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ToggleLeft,
  ToggleRight,
  Key,
  Link as LinkIcon,
  AlertCircle,
  Cpu,
  Bot,
  RefreshCw,
  Calculator,
  X,
  Copy,
  CircleDollarSign,
  Cloud
} from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'records' | 'settings'>('overview');
  
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
  const formatMoney = (amountInCNY: number) => {
      if (currency === 'CNY') {
          return `¥${amountInCNY.toFixed(2)}`;
      } else {
          const usd = amountInCNY * 0.138;
          return `$${usd.toFixed(2)}`;
      }
  };

  const getBalanceStatus = (balance: number) => {
      if (balance <= 0) {
          return {
              textClass: 'text-red-400',
              statusText: t.statusOffline,
              dotClass: 'bg-red-500 shadow-[0_0_8px_rgb(239,68,68)] animate-pulse-fast'
          };
      } else if (balance <= 30) {
          return {
              textClass: 'text-yellow-400',
              statusText: t.statusRecommend,
              dotClass: 'bg-yellow-400 shadow-[0_0_8px_rgb(250,204,21)] animate-pulse-slow'
          };
      }
      return {
          textClass: 'text-white', 
          statusText: t.statusActive,
          dotClass: 'bg-green-400 shadow-[0_0_8px_rgb(74,222,128)]'
      };
  };

  const totalSubsidyMoney = overview 
      ? parseFloat(((overview.subsidyMoney?.elec || 0) + (overview.subsidyMoney?.cold || 0) + (overview.subsidyMoney?.hot || 0)).toFixed(2))
      : 0;
  
  const balanceStatus = overview ? getBalanceStatus(overview.balance) : getBalanceStatus(0);

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
      await supabase.auth.signOut();
      
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

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-4 sm:gap-8 mt-6 flex-wrap px-2">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
             <div className="w-2 h-2 rounded-full ring-2 ring-opacity-20 ring-offset-1 dark:ring-offset-gray-800 shrink-0" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
               {entry.value}
             </span>
          </div>
        ))}
        {/* Added Dashed Line Legend Item */}
        <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
             <div className="w-4 h-0 border-t-2 border-dashed border-gray-400 opacity-50"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
               {t.estimatedToday}
             </span>
        </div>
      </div>
    );
  };

  const prepareChartData = () => {
    const dateMap: Record<string, any> = {};
    let lastDateObj: Date | null = null;

    trends.forEach(group => {
        const typeId = Number(group.energyType);
        group.datas.forEach(pt => {
            const dateObj = new Date(pt.recordTime);
            if (!lastDateObj || dateObj > lastDateObj) lastDateObj = dateObj;
            const d = dateObj.toLocaleDateString(lang === Language.ZH ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' });
            if (!dateMap[d]) dateMap[d] = { name: d, rawDate: dateObj.getTime() };
            let key = '';
            if (typeId === EnergyType.ELEC) key = 'elec';
            else if (typeId === EnergyType.COLD_WATER) key = 'cold';
            else if (typeId === EnergyType.HOT_WATER) key = 'hot';
            if (key) dateMap[d][key] = pt.dataValue;
        });
    });

    let data = Object.values(dateMap).sort((a,b) => a.rawDate - b.rawDate);

    const today = new Date();
    const isCurrentMonth = chartDate.getMonth() === today.getMonth() && chartDate.getFullYear() === today.getFullYear();
    
    if (isCurrentMonth && lastDateObj) {
        const lastDay = lastDateObj.getDate();
        const currentDay = today.getDate();
        if (lastDay < currentDay) {
            const getLast3Avg = (key: string) => {
                const recent = data.slice(-3).map(d => d[key] || 0).filter(v => v > 0);
                if (recent.length === 0) return 0;
                const sum = recent.reduce((a, b) => a + b, 0);
                return parseFloat((sum / recent.length).toFixed(2));
            };
            data.push({
                name: today.toLocaleDateString(lang === Language.ZH ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' }) + (lang === Language.ZH ? ' (预估)' : ' (Est.)'),
                elec: getLast3Avg('elec'),
                cold: getLast3Avg('cold'),
                hot: getLast3Avg('hot'),
                isEstimate: true
            });
        }
    }
    return data;
  };

  // --- Render Login ---
  if (isAutoLoggingIn) {
      return (
          <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-[60] animate-fade-in">
              <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 animate-pulse">
                      <Home size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">欢迎回家</h2>
                  <p className="text-gray-500 font-medium">{userName || 'User'}</p>
                  <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                  </div>
              </div>
          </div>
      );
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

    if (showCloudAuth) {
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
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[#f2f4f6] dark:bg-gray-900 transition-colors">
        
        {/* Server Config Modal */}
        {showServerConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-sm p-6 shadow-2xl animate-pop-in border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg dark:text-white">Server Settings</h3>
                        <button onClick={() => setShowServerConfig(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Custom API URL</label>
                            <input 
                                type="text" 
                                value={customApiUrl} 
                                onChange={(e) => setCustomApiUrl(e.target.value)} 
                                placeholder={API_BASE_URL} 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white text-sm" 
                            />
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                Configure this if you are accessing via Cloudflare Tunnel or external proxy.
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                setShowServerConfig(false);
                                // Save handled by useEffect
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 border border-white/50 dark:border-gray-700 relative">
          
          {/* Server Config Entry */}
          <button 
             onClick={() => setShowServerConfig(true)}
             className="absolute top-6 left-6 p-2 rounded-full text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
          >
             <Settings size={20} />
          </button>

          {/* Subtle Cloud Login Entry */}
          <button 
             onClick={() => setShowCloudAuth(true)}
             className="absolute top-6 right-6 p-2 rounded-full text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
          >
             <Cloud size={20} />
          </button>

          <div className="flex justify-between items-center mb-10">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <Zap size={24} fill="currentColor" />
            </div>
            <div className="flex gap-2">
               <button onClick={() => setLang(l => l === Language.ZH ? Language.EN : Language.ZH)} className="p-2.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors">
                  <Globe size={18} />
               </button>
               <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors">
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
               </button>
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-3 dark:text-white tracking-tight">{t.login}</h2>
          <p className="text-gray-400 mb-8 font-medium">{t.title}</p>

          <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                value={loginRoom}
                onChange={(e) => setLoginRoom(e.target.value)}
                placeholder={t.roomPlaceholder}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 dark:text-white outline-none transition-all font-bold text-lg placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            
            {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    {errorMsg}
                </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading || !loginRoom}
              className="w-full bg-gray-900 dark:bg-white hover:opacity-90 active:scale-[0.98] text-white dark:text-black font-bold py-4 rounded-2xl transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none mt-4"
            >
              {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      {t.loading}
                  </div>
              ) : t.login}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
             <button 
               onClick={enterDemoMode}
               className="text-xs font-bold text-gray-400 hover:text-primary transition-colors tracking-wide uppercase"
             >
                {t.tryDemo}
             </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Layout ---
  return (
    <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] dark:bg-black text-gray-900 dark:text-gray-100 transition-colors overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Recharge Calculator Modal */}
      {showCalculator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-md p-6 shadow-2xl scale-100 animate-pop-in border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                             <Calculator size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{t.calcTitle}</h3>
                            <p className="text-xs text-gray-400">{t.calcDesc}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowCalculator(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="space-y-5 overflow-y-auto no-scrollbar">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl flex justify-between items-center">
                          <span className="font-bold text-gray-500">{t.balance}</span>
                          <span className="font-black text-2xl">{formatMoney(overview?.balance || 0)}</span>
                      </div>
                      
                      {/* Roommates Slider */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">{t.roommates}</label>
                          <div className="flex items-center gap-4">
                              <input 
                                  type="range" 
                                  min="1" 
                                  max="8" 
                                  value={roommates} 
                                  onChange={(e) => setRoommates(parseInt(e.target.value))}
                                  className="flex-1 accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                              />
                              <span className="font-bold text-xl w-8 text-center">{roommates}</span>
                          </div>
                      </div>

                      {/* Days Slider */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">{t.daysToCover}</label>
                          <div className="flex items-center gap-4">
                              <input 
                                  type="range" 
                                  min="7" 
                                  max="90" 
                                  step="1"
                                  value={daysToCover} 
                                  onChange={(e) => setDaysToCover(parseInt(e.target.value))}
                                  className="flex-1 accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                              />
                              <span className="font-bold text-xl w-10 text-center">{daysToCover}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-1 font-medium">
                              <span>7 Days</span>
                              <span>90 Days</span>
                          </div>
                      </div>

                      <div className="pt-2">
                          <button 
                              onClick={handleCalculateRecharge}
                              disabled={isCalcLoading || !enableAI}
                              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                          >
                              {isCalcLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Bot size={18} />}
                              {enableAI ? t.generatePlan : t.configureAi}
                          </button>
                      </div>

                      {calcResult && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-bold text-indigo-400 uppercase">AI Plan</span>
                                  <button onClick={() => navigator.clipboard.writeText(calcResult)} className="text-indigo-500 hover:text-indigo-700">
                                      <Copy size={14} />
                                  </button>
                              </div>
                              <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
                                  <MarkdownText content={calcResult} />
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 fixed inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50">
        <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                    <Zap size={20} fill="currentColor" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">IBS Client</h1>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {overview?.room?.substring(0, 1)}
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Room</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{overview?.room}</p>
                  </div>
              </div>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
            <SidebarItem icon={<LayoutDashboard size={20}/>} label={t.dashboard} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarItem icon={<Activity size={20}/>} label={t.trends} active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} />
            <SidebarItem icon={<History size={20}/>} label={t.records} active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
            <div className="pt-4 mt-4 border-t border-gray-50 dark:border-gray-800/50">
                <SidebarItem icon={<Settings size={20}/>} label={t.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>
        </nav>

        <div className="p-6">
             <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full p-3 rounded-2xl transition-colors font-bold text-sm">
                 <LogOut size={16} />
                 <span>{t.logout}</span>
             </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-40 flex items-center justify-between px-4 transition-all duration-300">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xs">
              {overview?.room?.substring(0, 1) || 'R'}
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-tight">{overview?.room}</span>
                {weather && (
                    <span className="text-[10px] font-medium text-gray-400 leading-tight">
                        {weather.weather} {weather.temperature}°
                    </span>
                )}
            </div>
         </div>
         <button onClick={handleRefresh} className={`p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 ${isLoading ? 'animate-spin' : ''}`}>
             <RefreshCw size={20} />
         </button>
      </div>

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

          {activeTab === 'overview' && !overview && (
              <div className="space-y-6 animate-pulse">
                  {/* Skeleton Master Card */}
                  <div className="rounded-[32px] bg-gray-200 dark:bg-gray-800 h-[220px] p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                          <div className="space-y-3">
                              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                              <div className="h-10 w-48 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      </div>
                      <div className="flex justify-between items-end">
                          <div className="space-y-2">
                              <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          </div>
                          <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      </div>
                  </div>

                  {/* Skeleton Toggles */}
                  <div className="flex justify-end gap-3">
                      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                  </div>

                  {/* Skeleton Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                          <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-5 h-32 flex flex-col justify-between border border-gray-100 dark:border-gray-800">
                              <div className="flex justify-between">
                                  <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
                                  <div className="w-12 h-5 rounded-full bg-gray-100 dark:bg-gray-700"></div>
                              </div>
                              <div className="space-y-2">
                                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                  <div className="flex justify-between">
                                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'overview' && overview && (
              <div className="animate-fade-in space-y-6">
                  {/* Daily Brief Greeting */}
                  {dailyBrief && (
                      <div className="animate-fade-in mb-2 px-2">
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
                              <span>👋</span>
                              <span>{dailyBrief}</span>
                          </p>
                      </div>
                  )}

                  {/* Master Card */}
                  <div className="relative overflow-hidden rounded-[32px] bg-gray-900 dark:bg-gray-800 text-white p-8 shadow-2xl shadow-gray-900/20 dark:shadow-none min-h-[220px] flex flex-col justify-between group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 -mr-16 -mt-16 pointer-events-none"></div>
                      
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${balanceStatus.dotClass}`}></div>
                                  <p className="text-sm font-bold text-gray-300 dark:text-gray-400">{balanceStatus.statusText}</p>
                              </div>
                              <p className="text-gray-400 font-medium text-sm uppercase tracking-widest mb-1">{t.balance}</p>
                              <h3 className={`text-5xl font-black tracking-tighter ${balanceStatus.textClass}`}>
                                  <CountUp value={overview.balance} formatter={formatMoney} />
                              </h3>
                          </div>
                          <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setShowCalculator(true)}
                                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-90 group/calc"
                            >
                                <Calculator size={24} className="text-white opacity-80 group-hover/calc:opacity-100" />
                            </button>
                          </div>
                      </div>

                      <div className="relative z-10 mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                          <div className="flex gap-8 md:gap-12">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.totalCost}</p>
                                <p className="text-xl font-bold">
                                    <CountUp value={overview.costs.total} formatter={formatMoney} />
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.subsidyLabel}</p>
                                <p className={`text-xl font-bold ${totalSubsidyMoney > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    <CountUp value={totalSubsidyMoney} formatter={formatMoney} />
                                </p>
                            </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Toggles (Unit Only) */}
                  <div className="flex justify-end gap-3 animate-fade-in-up delay-100">
                      <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex transition-colors duration-300">
                          <button 
                             onClick={() => setDisplayUnit('money')}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${displayUnit === 'money' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                          >
                             {t.showMoney}
                          </button>
                          <button 
                             onClick={() => setDisplayUnit('unit')}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${displayUnit === 'unit' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                          >
                             {t.showUnit}
                          </button>
                      </div>
                  </div>

                  {/* Details Grid - Bento Style */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-200">
                      <DataCard 
                          title={t.electricity}
                          animatedValue={displayUnit === 'money' ? overview.costs.elec : overview.details.elec[0]}
                          formatFn={displayUnit === 'money' ? formatMoney : (v) => `${v.toFixed(2)} ${t.unitKwh}`}
                          subValue={displayUnit === 'money' ? `${overview.details.elec[0]} ${t.unitKwh}` : formatMoney(overview.costs.elec)}
                          subsidy={displayUnit === 'money' 
                              ? formatMoney(overview.subsidyMoney?.elec || 0)
                              : `${overview.subsidy?.elec || 0} ${t.unitKwh}`
                          }
                          subsidyVariant={(overview.subsidy?.elec || 0) > 0 ? 'success' : 'danger'}
                          icon={<Zap size={22}/>}
                          colorClass="text-yellow-600 bg-yellow-400"
                          trend="+2.4%"
                          onClick={handleRefresh}
                      />
                      <DataCard 
                          title={t.coldWater}
                          animatedValue={displayUnit === 'money' ? overview.costs.cold : overview.details.cold[0]}
                          formatFn={displayUnit === 'money' ? formatMoney : (v) => `${v.toFixed(2)} ${t.unitM3}`}
                          subValue={displayUnit === 'money' ? `${overview.details.cold[0]} ${t.unitM3}` : formatMoney(overview.costs.cold)}
                          subsidy={displayUnit === 'money' 
                              ? formatMoney(overview.subsidyMoney?.cold || 0)
                              : `${overview.subsidy?.cold || 0} ${t.unitM3}`
                          }
                          subsidyVariant={(overview.subsidy?.cold || 0) > 0 ? 'success' : 'danger'}
                          icon={<Droplet size={22}/>}
                          colorClass="text-blue-600 bg-blue-400"
                          trend="-0.5%"
                          onClick={handleRefresh}
                      />
                       <DataCard 
                          title={t.hotWater}
                          animatedValue={displayUnit === 'money' ? overview.costs.hot : overview.details.hot[0]}
                          formatFn={displayUnit === 'money' ? formatMoney : (v) => `${v.toFixed(2)} ${t.unitM3}`}
                          subValue={displayUnit === 'money' ? `${overview.details.hot[0]} ${t.unitM3}` : formatMoney(overview.costs.hot)}
                          subsidy={displayUnit === 'money' 
                              ? formatMoney(overview.subsidyMoney?.hot || 0)
                              : `${overview.subsidy?.hot || 0} ${t.unitM3}`
                          }
                          subsidyVariant={(overview.subsidy?.hot || 0) > 0 ? 'success' : 'danger'}
                          icon={<Flame size={22}/>}
                          colorClass="text-orange-600 bg-orange-400"
                          onClick={handleRefresh}
                      />
                  </div>
              </div>
          )}

          {activeTab === 'trends' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 h-[65vh] min-h-[450px] flex flex-col">
                    
                    {/* Trends Header with Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2 sm:flex-1">
                            <TrendingUp size={20} className="text-primary"/>
                            {t.trends}
                        </h3>
                        
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl mx-auto sm:mx-0">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all text-gray-500 dark:text-gray-300">
                                <ChevronRight size={18} className="rotate-180" />
                            </button>
                            <span className="text-xs font-bold w-24 text-center text-gray-900 dark:text-white">
                                {chartDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                            </span>
                            <button onClick={() => changeMonth(1)} disabled={new Date(chartDate).setMonth(chartDate.getMonth() + 1) > Date.now()} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all text-gray-500 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={prepareChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} opacity={0.5} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke={isDark ? '#6b7280' : '#9ca3af'} 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={10}
                                    fontWeight={500}
                                />
                                <YAxis 
                                    stroke={isDark ? '#6b7280' : '#9ca3af'} 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    fontWeight={500}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: isDark ? '#1f2937' : '#fff', 
                                        borderColor: isDark ? '#374151' : '#fff', 
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }} 
                                    itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
                                    labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    cursor={{ stroke: isDark ? '#374151' : '#e5e7eb', strokeWidth: 2 }}
                                />
                                <Line type="natural" dataKey="elec" name={t.electricity} stroke="#eab308" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} strokeDasharray={3} />
                                <Line type="natural" dataKey="cold" name={t.coldWater} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
                                <Line type="natural" dataKey="hot" name={t.hotWater} stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
                                <Legend content={<CustomLegend />} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Trend Analysis */}
                <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                <BrainCircuit size={20} />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{t.trendAnalysisTitle}</h4>
                        </div>
                        {!trendAnalysis && (
                            <button 
                                onClick={handleTrendAnalysis}
                                disabled={isTrendAiLoading || !enableAI}
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isTrendAiLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                {enableAI ? t.generateAnalysis : t.analysisNotEnabled}
                            </button>
                        )}
                    </div>
                    
                    {trendAnalysis ? (
                        <div className="animate-fade-in bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl">
                            <MarkdownText content={trendAnalysis} className="text-gray-600 dark:text-gray-300" />
                            <button onClick={() => setTrendAnalysis('')} className="mt-3 text-xs text-gray-400 underline font-medium">{t.regenerate}</button>
                        </div>
                    ) : (
                         <p className="text-xs text-gray-400 pl-1">{t.analysisPlaceholder}</p>
                    )}
                </div>
              </div>
          )}

          {activeTab === 'records' && (
              <div className="space-y-4 animate-fade-in pb-20">
                  <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700/50">
                            <h3 className="font-bold text-lg dark:text-white">{t.rechargeRecords}</h3>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {records.length === 0 ? (
                              <div className="p-12 text-center text-gray-400 font-medium">No transaction history</div>
                            ) : records.map((rec, idx) => (
                                <div key={idx} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${rec.dataValue > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {rec.dataValue > 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{rec.paymentType}</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(rec.logTime).toLocaleDateString()} · {new Date(rec.logTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${rec.dataValue > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {rec.dataValue > 0 ? '+' : ''}{formatMoney(rec.dataValue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in pb-12">
                   <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">{t.general}</h3>
                        <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><Globe size={20} /></div>
                                     <span className="font-bold text-gray-900 dark:text-white">{t.language}</span>
                                 </div>
                                 <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                     <button onClick={() => setLang(Language.ZH)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === Language.ZH ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>中文</button>
                                     <button onClick={() => setLang(Language.EN)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === Language.EN ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>EN</button>
                                 </div>
                             </div>
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">{isDark ? <Moon size={20} /> : <Sun size={20} />}</div>
                                     <span className="font-bold text-gray-900 dark:text-white">{isDark ? t.darkMode : t.lightMode}</span>
                                 </div>
                                 <button onClick={() => setIsDark(!isDark)} className="text-gray-400 hover:text-primary transition-colors">{isDark ? <ToggleRight size={40} className="text-primary" fill="currentColor" /> : <ToggleLeft size={40} />}</button>
                             </div>
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><CircleDollarSign size={20} /></div>
                                     <span className="font-bold text-gray-900 dark:text-white">{t.currencyLabel}</span>
                                 </div>
                                 <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                     <button onClick={() => setCurrency('CNY')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'CNY' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>CNY</button>
                                     <button onClick={() => setCurrency('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>USD</button>
                                 </div>
                             </div>
                        </div>
                   </div>

                   <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold dark:text-white">{t.aiConfig}</h3>
                                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">{t.betaTag}</span>
                             </div>
                             <button onClick={() => setEnableAI(!enableAI)} className="transition-colors">{enableAI ? <ToggleRight size={40} className="text-indigo-500" fill="currentColor" /> : <ToggleLeft size={40} className="text-gray-300" />}</button>
                        </div>
                        {enableAI && (
                            <div className="space-y-5 animate-fade-in-down">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.aiProvider}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setAiProvider('google')} className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'google' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}><Bot size={18} />Google GenAI</button>
                                        <button onClick={() => setAiProvider('openai')} className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'openai' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}><Cpu size={18} />OpenAI / DashScope</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">API Key</label>
                                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Key size={18} /></div><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={t.apiKeyPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.modelName}</label>
                                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Cpu size={18} /></div><input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder={t.modelPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Base URL {aiProvider === 'google' ? '(Optional)' : '(Required)'}</label>
                                    <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><LinkIcon size={18} /></div><input type="text" value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)} placeholder={t.apiUrlPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" /></div>
                                    {aiProvider === 'openai' && (<p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">{t.baseUrlHint}</p>)}
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Advanced Settings */}
                   <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">Advanced</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Custom Server URL</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <LinkIcon size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={customApiUrl} 
                                    onChange={(e) => setCustomApiUrl(e.target.value)} 
                                    placeholder={API_BASE_URL} 
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white text-xs" 
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
                                Use Cloudflare Tunnel or Proxy. Leave empty for default.
                            </p>
                        </div>
                   </div>

                   <div className="pt-2">
                       <button onClick={handleLogout} className="w-full py-4 bg-white dark:bg-gray-800 text-red-500 rounded-[32px] font-bold text-sm shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"><LogOut size={18} />{t.logout}</button>
                   </div>
              </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-6 left-4 right-4 border border-gray-200 dark:border-white/10 rounded-2xl z-50 p-2 flex justify-between items-center transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${Capacitor.getPlatform() === 'ios' ? 'ios-liquid-glass' : 'bg-white/90 dark:bg-gray-950/85 backdrop-blur-xl'}`}>
        <MobileNavItem icon={<LayoutDashboard size={22} strokeWidth={activeTab === 'overview' ? 2.5 : 2}/>} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <MobileNavItem icon={<Activity size={22} strokeWidth={activeTab === 'trends' ? 2.5 : 2}/>} active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} />
        <MobileNavItem icon={<History size={22} strokeWidth={activeTab === 'records' ? 2.5 : 2}/>} active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
        <MobileNavItem icon={<Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2}/>} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );
};

// Subcomponents
const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm mb-1 ${active ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
        <div className={active ? 'text-primary' : ''}>{icon}</div><span>{label}</span>{active && <ChevronRight size={14} className="ml-auto text-gray-400" />}
    </button>
);

const MobileNavItem: React.FC<{icon: React.ReactNode, active: boolean, onClick: () => void}> = ({ icon, active, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-90 ${active ? 'text-primary dark:text-white bg-primary/10 dark:bg-white/10' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
        {icon}
    </button>
);

export default App;