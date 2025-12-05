
import React, { useState, useEffect } from 'react';
import { ibsService } from './services/ibsService';
import { aiService } from './services/geminiService';
import { weatherService, WeatherData } from './services/weatherService';
import { 
  OverviewData, 
  PaymentRecord, 
  MetricalDataResult, 
  Language,
  EnergyType,
  AIProvider
} from './types';
import { LABELS } from './constants';
import DataCard from './components/DataCard';
import { CountUp } from './components/CountUp';
import { MarkdownText } from './components/MarkdownText';
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
  Calendar,
  X,
  Copy,
  Check,
  CircleDollarSign
} from 'lucide-react';

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_OVERVIEW: OverviewData = {
  room: "T8201",
  balance: 124.50,
  costs: { elec: 85.20, cold: 24.50, hot: 12.00, total: 121.70 },
  subsidy: { elec: 15.50, cold: 5.00, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.10, hot: 0 }, // Est based on rates
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
  
  // CRITICAL FIX FOR DEMO MODE:
  // If we are simulating the current month, only generate data up to YESTERDAY.
  // This ensures the "Today (Estimated)" logic in prepareChartData (which checks if last data point < today) actually triggers.
  // If we generated data for today, the estimate wouldn't show.
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
  const [chartDate, setChartDate] = useState(new Date()); // Controls which month we are viewing in Trends
  
  // UI Toggles
  const [displayUnit, setDisplayUnit] = useState<'money' | 'unit'>('money'); // Toggle for DataCards
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY'); // Toggle for Currency
  const [showCalculator, setShowCalculator] = useState(false); // Bill Splitter Modal

  // AI & Calculator State
  const [aiSummary, setAiSummary] = useState('');
  const [dailyBrief, setDailyBrief] = useState('');
  const [trendAnalysis, setTrendAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTrendAiLoading, setIsTrendAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const [roommates, setRoommates] = useState(4);
  const [daysToCover, setDaysToCover] = useState(30); // New: Days to cover
  const [calcResult, setCalcResult] = useState('');
  const [isCalcLoading, setIsCalcLoading] = useState(false);

  const t = LABELS[lang];

  // --- Helpers ---
  const formatMoney = (amountInCNY: number) => {
      if (currency === 'CNY') {
          return `¥${amountInCNY.toFixed(2)}`;
      } else {
          // Approx Exchange Rate 1 CNY = 0.138 USD
          const usd = amountInCNY * 0.138;
          return `$${usd.toFixed(2)}`;
      }
  };

  // --- Effects ---
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle Provider Change Defaults
  useEffect(() => {
    if (aiProvider === 'google' && aiModel === 'qwen-plus') {
        setAiModel('gemini-2.5-flash');
    } else if (aiProvider === 'openai' && aiModel === 'gemini-2.5-flash') {
        setAiModel('qwen-plus');
    }
  }, [aiProvider]);

  // Reload trends when chartDate changes (if logged in and not demo)
  useEffect(() => {
      if (isLoggedIn && !isDemo) {
          refreshTrendsOnly();
      } else if (isDemo) {
          setTrends(generateMockTrends(chartDate));
      }
  }, [chartDate]);

  // --- Handlers ---
  const enterDemoMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsDemo(true);
      setIsLoggedIn(true);
      setOverview(MOCK_OVERVIEW);
      setRecords(MOCK_RECORDS);
      setTrends(generateMockTrends());
      
      // Fake AI Brief in Demo
      setDailyBrief("☀️ 早安！又是元气满满的一天，记得节约用电哦~");
      
      setIsLoading(false);
    }, 800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (loginRoom.toUpperCase() === 'DEMO') {
      enterDemoMode();
      return;
    }

    try {
      await ibsService.login(loginRoom);
      setIsLoggedIn(true);
      setIsDemo(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(t.loginFail + ": " + (err.message || 'Unknown'));
    } finally {
      setIsLoading(false);
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
      
      // Trigger Daily Brief if AI Ready
      if (enableAI && apiKey) {
          aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
          aiService.generateDailyBrief(ov, lang, wx).then(setDailyBrief).catch(console.error);
      }
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
    if (!enableAI) {
      setActiveTab('settings');
      return;
    }
    if (!apiKey) {
      setActiveTab('settings');
      setAiError(lang === Language.ZH ? '请先配置 API Key' : 'API Key missing');
      return;
    }
    if (!overview) return;
    
    setIsAiLoading(true);
    setAiError('');
    try {
      aiService.initialize(apiKey, aiBaseUrl, aiProvider, aiModel);
      const summary = await aiService.generateSummary(overview, trends, lang);
      setAiSummary(summary);
    } catch (e: any) {
      setAiError(e.message || "Failed to generate summary.");
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
        
        // Calculate recent daily avg
        // We use the last available data points
        let totalDailyAvg = 0;
        trends.forEach(t => {
            if (t.datas.length > 0) {
                const recent = t.datas.slice(-5); // last 5 days
                const avgVal = recent.reduce((a, b) => a + b.dataValue, 0) / recent.length;
                // Estimate cost using default rates if necessary
                const typeId = Number(t.energyType);
                let price = 0.647; // Default Elec
                if (typeId === 3) price = 2.82;
                if (typeId === 4) price = 25.0;
                totalDailyAvg += avgVal * price;
            }
        });
        
        // Fallback if no trends
        if (totalDailyAvg === 0) totalDailyAvg = overview.costs.total / 30; // Rough estimate

        const estimatedNeed = totalDailyAvg * daysToCover;
        const currentBalance = overview.balance;
        const toRecharge = Math.max(0, estimatedNeed - currentBalance);
        const perPerson = toRecharge / roommates;
        
        const sysPrompt = "You are a helpful assistant assisting university students calculating utility recharge.";
        const userPrompt = lang === Language.ZH 
            ? `请根据以下数据生成充值建议：
               当前余额: ¥${currentBalance.toFixed(2)}
               过去几天平均日消耗: ¥${totalDailyAvg.toFixed(2)}/天
               预计覆盖天数: ${daysToCover}天
               宿舍人数: ${roommates}人
               
               计算公式: (日消耗 * 天数) - 余额 = 需充值金额。
               
               请输出：
               1. 需充值总额 (建议向上取整到10元)
               2. 每人应付 (精确到分)
               3. 一段幽默的催款文案供复制。`
            : `Calculate recharge plan:
               Balance: ¥${currentBalance.toFixed(2)}
               Daily Burn: ¥${totalDailyAvg.toFixed(2)}
               Days to Cover: ${daysToCover}
               Roommates: ${roommates}
               
               Logic: (Daily * Days) - Balance = Need.
               
               Output:
               1. Total to Recharge (Round up to nearest 10)
               2. Per Person
               3. A funny text message to send to roommates.`;

        const res = await aiService.ask(sysPrompt, userPrompt);
        setCalcResult(res);

      } catch (e: any) {
          setCalcResult("Error: " + e.message);
      } finally {
          setIsCalcLoading(false);
      }
  };

  const handleLogout = () => {
      ibsService.logout();
      setIsLoggedIn(false);
      setIsDemo(false);
      setOverview(null);
      setRecords([]);
      setTrends([]);
      setAiSummary('');
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

  // --- Custom Chart Legend ---
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-6 flex-wrap">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full ring-2 ring-opacity-20 ring-offset-1 dark:ring-offset-gray-800" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               {entry.value}
             </span>
          </div>
        ))}
      </div>
    );
  };

  // --- Chart Data Prep ---
  const prepareChartData = () => {
    const dateMap: Record<string, any> = {};
    let lastDateObj: Date | null = null;

    trends.forEach(group => {
        const typeId = Number(group.energyType);
        
        group.datas.forEach(pt => {
            const dateObj = new Date(pt.recordTime);
            // Update last seen date
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

    // --- Today's Estimation Logic ---
    // If the last data point is NOT today, and we are viewing the current month, add an estimate.
    const today = new Date();
    const isCurrentMonth = chartDate.getMonth() === today.getMonth() && chartDate.getFullYear() === today.getFullYear();
    
    if (isCurrentMonth && lastDateObj) {
        const lastDay = lastDateObj.getDate();
        const currentDay = today.getDate();

        if (lastDay < currentDay) {
            // Calculate simple average of last 3 points for each type
            const getLast3Avg = (key: string) => {
                const recent = data.slice(-3).map(d => d[key] || 0).filter(v => v > 0);
                if (recent.length === 0) return 0;
                const sum = recent.reduce((a, b) => a + b, 0);
                return parseFloat((sum / recent.length).toFixed(2));
            };

            const estElec = getLast3Avg('elec');
            const estCold = getLast3Avg('cold');
            const estHot = getLast3Avg('hot');

            const todayStr = today.toLocaleDateString(lang === Language.ZH ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' });
            
            data.push({
                name: todayStr + (lang === Language.ZH ? ' (预估)' : ' (Est.)'),
                elec: estElec,
                cold: estCold,
                hot: estHot,
                isEstimate: true // Flag for custom rendering if needed
            });
        }
    }

    return data;
  };

  // --- Render Login ---
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[#f2f4f6] dark:bg-gray-900 transition-colors">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 border border-white/50 dark:border-gray-700">
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

          <div className="mt-8 text-center">
             <button 
               onClick={enterDemoMode}
               className="text-xs font-bold text-gray-400 hover:text-primary transition-colors tracking-wide uppercase"
             >
                {lang === Language.ZH ? '试用演示模式' : 'Try Demo Mode'}
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
                              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
                                  {calcResult}
                              </p>
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
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{weather.weather}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
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

                  {/* Master Card - "Apple Wallet" Style */}
                  <div className="relative overflow-hidden rounded-[32px] bg-gray-900 dark:bg-gray-800 text-white p-8 shadow-2xl shadow-gray-900/20 dark:shadow-none min-h-[220px] flex flex-col justify-between group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 -mr-16 -mt-16 pointer-events-none"></div>
                      
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <p className="text-gray-400 font-medium text-sm uppercase tracking-widest mb-1">{t.balance}</p>
                              <h3 className="text-5xl font-black tracking-tighter">
                                  <CountUp value={overview.balance} formatter={formatMoney} />
                              </h3>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Wallet size={24} className="text-white" />
                            </div>
                          </div>
                      </div>

                      <div className="relative z-10 mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                          <div className="flex gap-12">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.totalCost}</p>
                                <p className="text-xl font-bold">
                                    <CountUp value={overview.costs.total} formatter={formatMoney} />
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgb(74,222,128)]"></div>
                                    <p className="text-sm font-bold">Active</p>
                                </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setShowCalculator(true)}
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/10 active:scale-95"
                          >
                              <Calculator size={14} className="shrink-0" />
                              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide whitespace-nowrap">{t.calculator}</span>
                          </button>
                      </div>
                  </div>
                  
                  {/* Toggles (Unit Only - Currency moved to Settings) */}
                  <div className="flex justify-end gap-3 animate-fade-in-up delay-100">
                      {/* Display Unit Toggle */}
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
                              ? (overview.subsidyMoney?.elec > 0 ? formatMoney(overview.subsidyMoney.elec) : undefined)
                              : (overview.subsidy?.elec > 0 ? `${overview.subsidy.elec} ${t.unitKwh}` : undefined)
                          }
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
                              ? (overview.subsidyMoney?.cold > 0 ? formatMoney(overview.subsidyMoney.cold) : undefined)
                              : (overview.subsidy?.cold > 0 ? `${overview.subsidy.cold} ${t.unitM3}` : undefined)
                          }
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
                              ? (overview.subsidyMoney?.hot > 0 ? formatMoney(overview.subsidyMoney.hot) : undefined)
                              : (overview.subsidy?.hot > 0 ? `${overview.subsidy.hot} ${t.unitM3}` : undefined)
                          }
                          icon={<Flame size={22}/>}
                          colorClass="text-orange-600 bg-orange-400"
                          onClick={handleRefresh}
                      />
                  </div>

                  {/* AI Insight Pill */}
                  <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl ${enableAI ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{t.aiAnalysis}</h4>
                                        {!enableAI && <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">{t.betaTag}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 max-w-lg mt-1">
                                        {enableAI 
                                            ? (aiSummary ? (lang === Language.ZH ? '分析已生成' : 'Analysis Ready') : (lang === Language.ZH ? '获取基于您用水用电习惯的智能分析与建议。' : 'Get smart insights based on your usage patterns.'))
                                            : t.aiDescription
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {!enableAI ? (
                                <button 
                                    onClick={() => setActiveTab('settings')}
                                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all whitespace-nowrap"
                                >
                                    {t.enableAI}
                                </button>
                            ) : !apiKey ? (
                                <button 
                                    onClick={() => setActiveTab('settings')}
                                    className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:opacity-90 transition-all whitespace-nowrap"
                                >
                                    {t.configureAi}
                                </button>
                            ) : !aiSummary ? (
                                <button 
                                    onClick={handleAiSummary}
                                    disabled={isAiLoading}
                                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none whitespace-nowrap flex items-center gap-2"
                                >
                                    {isAiLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                    {isAiLoading ? t.loading : t.generateSummary}
                                </button>
                            ) : (
                                <button onClick={() => setAiSummary('')} className="text-gray-400 hover:text-gray-600 text-sm font-bold underline">
                                    {lang === Language.ZH ? '清除' : 'Clear'}
                                </button>
                            )}
                        </div>

                        {aiError && (
                             <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                                <AlertCircle size={16} />
                                {aiError}
                             </div>
                        )}

                        {aiSummary && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                                    {aiSummary}
                                </p>
                            </div>
                        )}
                  </div>
              </div>
          )}

          {activeTab === 'trends' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 h-[65vh] min-h-[450px] flex flex-col">
                    
                    {/* Trends Header with Controls */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary"/>
                            {t.trends}
                        </h3>
                        
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl">
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
                        {/* Legend for Estimated Line (Simple visual cue) */}
                        <div className="absolute top-0 right-0 z-10 flex gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/80 dark:bg-black/20 backdrop-blur px-2 py-1 rounded">
                                <div className="w-2 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                                <span>{t.estimatedToday}</span>
                            </div>
                        </div>

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
                            <h4 className="font-bold text-gray-900 dark:text-white">AI 趋势解读</h4>
                        </div>
                        {!trendAnalysis && (
                            <button 
                                onClick={handleTrendAnalysis}
                                disabled={isTrendAiLoading || !enableAI}
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isTrendAiLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                {enableAI ? '生成分析' : '未启用 AI'}
                            </button>
                        )}
                    </div>
                    
                    {trendAnalysis ? (
                        <div className="animate-fade-in bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl">
                            <MarkdownText content={trendAnalysis} className="text-gray-600 dark:text-gray-300" />
                            <button onClick={() => setTrendAnalysis('')} className="mt-3 text-xs text-gray-400 underline font-medium">重新生成</button>
                        </div>
                    ) : (
                         <p className="text-xs text-gray-400 pl-1">点击生成基于当前图表数据的智能分析报告。</p>
                    )}
                </div>
              </div>
          )}

          {activeTab === 'records' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
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
                   {/* General Settings */}
                   <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-6 dark:text-white">{t.general}</h3>
                        
                        <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                         <Globe size={20} />
                                     </div>
                                     <span className="font-bold text-gray-900 dark:text-white">{t.language}</span>
                                 </div>
                                 <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                     <button 
                                         onClick={() => setLang(Language.ZH)}
                                         className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === Language.ZH ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                     >
                                         中文
                                     </button>
                                     <button 
                                         onClick={() => setLang(Language.EN)}
                                         className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === Language.EN ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                     >
                                         EN
                                     </button>
                                 </div>
                             </div>

                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                         {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                     </div>
                                     <span className="font-bold text-gray-900 dark:text-white">{isDark ? t.darkMode : t.lightMode}</span>
                                 </div>
                                 <button onClick={() => setIsDark(!isDark)} className="text-gray-400 hover:text-primary transition-colors">
                                     {isDark ? <ToggleRight size={40} className="text-primary" fill="currentColor" /> : <ToggleLeft size={40} />}
                                 </button>
                             </div>

                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                         <CircleDollarSign size={20} />
                                     </div>
                                     <span className="font-bold text-gray-900 dark:text-white">{lang === Language.ZH ? '货币单位' : 'Currency'}</span>
                                 </div>
                                 <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                     <button 
                                         onClick={() => setCurrency('CNY')}
                                         className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'CNY' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                     >
                                         CNY
                                     </button>
                                     <button 
                                         onClick={() => setCurrency('USD')}
                                         className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}
                                     >
                                         USD
                                     </button>
                                 </div>
                             </div>
                        </div>
                   </div>

                   {/* AI Config */}
                   <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold dark:text-white">{t.aiConfig}</h3>
                                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">{t.betaTag}</span>
                             </div>
                             
                             <button onClick={() => setEnableAI(!enableAI)} className="transition-colors">
                                 {enableAI ? <ToggleRight size={40} className="text-indigo-500" fill="currentColor" /> : <ToggleLeft size={40} className="text-gray-300" />}
                             </button>
                        </div>

                        {enableAI && (
                            <div className="space-y-5 animate-fade-in-down">
                                
                                {/* Provider Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.aiProvider}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setAiProvider('google')}
                                            className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'google' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}
                                        >
                                            <Bot size={18} />
                                            Google GenAI
                                        </button>
                                        <button 
                                            onClick={() => setAiProvider('openai')}
                                            className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'openai' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}
                                        >
                                            <Cpu size={18} />
                                            OpenAI / DashScope
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">API Key</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Key size={18} />
                                        </div>
                                        <input 
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={t.apiKeyPlaceholder}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.modelName}</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Cpu size={18} />
                                        </div>
                                        <input 
                                            type="text"
                                            value={aiModel}
                                            onChange={(e) => setAiModel(e.target.value)}
                                            placeholder={t.modelPlaceholder}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Base URL {aiProvider === 'google' ? '(Optional)' : '(Required)'}</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <LinkIcon size={18} />
                                        </div>
                                        <input 
                                            type="text"
                                            value={aiBaseUrl}
                                            onChange={(e) => setAiBaseUrl(e.target.value)}
                                            placeholder={t.apiUrlPlaceholder}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white"
                                        />
                                    </div>
                                    {aiProvider === 'openai' && (
                                        <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
                                            {t.baseUrlHint}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Logout Button */}
                   <div className="pt-2">
                       <button 
                           onClick={handleLogout}
                           className="w-full py-4 bg-white dark:bg-gray-800 text-red-500 rounded-[32px] font-bold text-sm shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
                       >
                           <LogOut size={18} />
                           {t.logout}
                       </button>
                   </div>
              </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/90 dark:bg-gray-950/85 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl z-50 p-2 flex justify-between items-center transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
    <button 
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm mb-1 ${active ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
    >
        <div className={active ? 'text-primary' : ''}>{icon}</div>
        <span>{label}</span>
        {active && <ChevronRight size={14} className="ml-auto text-gray-400" />}
    </button>
);

const MobileNavItem: React.FC<{icon: React.ReactNode, active: boolean, onClick: () => void}> = ({ icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-90 ${
            active 
            ? 'text-primary dark:text-white bg-primary/10 dark:bg-white/10' 
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
    >
        {icon}
    </button>
);

export default App;