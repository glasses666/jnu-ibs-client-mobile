import { Bot, ChevronRight, CircleDollarSign, Cpu, Globe, Key, Link as LinkIcon, LogOut, Moon, Settings, Sun, ToggleLeft, ToggleRight } from 'lucide-react';

type SettingsPanelLabels = {
  general: string;
  language: string;
  darkMode: string;
  lightMode: string;
  currencyLabel: string;
  aiConfig: string;
  betaTag: string;
  aiProvider: string;
  apiKeyPlaceholder: string;
  modelName: string;
  modelPlaceholder: string;
  apiUrlPlaceholder: string;
  baseUrlHint: string;
  logout: string;
};

type SettingsPanelProps = {
  labels: SettingsPanelLabels;
  lang: 'zh' | 'en';
  isDark: boolean;
  currency: 'CNY' | 'USD';
  enableAI: boolean;
  aiProvider: 'google' | 'openai';
  apiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  showAdvancedSettings: boolean;
  customApiUrl: string;
  onSetLang: (value: 'zh' | 'en') => void;
  onToggleDarkMode: () => void;
  onSetCurrency: (value: 'CNY' | 'USD') => void;
  onToggleAI: () => void;
  onSetAiProvider: (value: 'google' | 'openai') => void;
  onSetApiKey: (value: string) => void;
  onSetAiModel: (value: string) => void;
  onSetAiBaseUrl: (value: string) => void;
  onToggleAdvancedSettings: () => void;
  onSetCustomApiUrl: (value: string) => void;
  onLogout: () => void;
};

export const SettingsPanel = ({
  labels,
  lang,
  isDark,
  currency,
  enableAI,
  aiProvider,
  apiKey,
  aiModel,
  aiBaseUrl,
  showAdvancedSettings,
  customApiUrl,
  onSetLang,
  onToggleDarkMode,
  onSetCurrency,
  onToggleAI,
  onSetAiProvider,
  onSetApiKey,
  onSetAiModel,
  onSetAiBaseUrl,
  onToggleAdvancedSettings,
  onSetCustomApiUrl,
  onLogout,
}: SettingsPanelProps) => (
  <div className="space-y-6 animate-fade-in pb-12">
    <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">{labels.general}</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Globe size={20} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{labels.language}</span>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button onClick={() => onSetLang('zh')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'zh' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>中文</button>
            <button onClick={() => onSetLang('en')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>EN</button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{isDark ? labels.darkMode : labels.lightMode}</span>
          </div>
          <button onClick={onToggleDarkMode} className="text-gray-400 hover:text-primary transition-colors">
            {isDark ? <ToggleRight size={40} className="text-primary" fill="currentColor" /> : <ToggleLeft size={40} />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <CircleDollarSign size={20} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{labels.currencyLabel}</span>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button onClick={() => onSetCurrency('CNY')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'CNY' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>CNY</button>
            <button onClick={() => onSetCurrency('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-600 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>USD</button>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold dark:text-white">{labels.aiConfig}</h3>
          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">{labels.betaTag}</span>
        </div>
        <button onClick={onToggleAI} className="transition-colors">
          {enableAI ? <ToggleRight size={40} className="text-indigo-500" fill="currentColor" /> : <ToggleLeft size={40} className="text-gray-300" />}
        </button>
      </div>

      {enableAI && (
        <div className="space-y-5 animate-fade-in-down">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{labels.aiProvider}</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onSetAiProvider('google')} className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'google' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}><Bot size={18} />Google GenAI</button>
              <button onClick={() => onSetAiProvider('openai')} className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${aiProvider === 'openai' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}><Cpu size={18} />OpenAI Compatible</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">API Key</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Key size={18} /></div>
              <input type="password" value={apiKey} onChange={(event) => onSetApiKey(event.target.value)} placeholder={labels.apiKeyPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{labels.modelName}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Cpu size={18} /></div>
              <input type="text" value={aiModel} onChange={(event) => onSetAiModel(event.target.value)} placeholder={labels.modelPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Base URL {aiProvider === 'google' ? '(Optional)' : '(Required)'}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><LinkIcon size={18} /></div>
              <input type="text" value={aiBaseUrl} onChange={(event) => onSetAiBaseUrl(event.target.value)} placeholder={labels.apiUrlPlaceholder} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white" />
            </div>
            {aiProvider === 'openai' && <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">{labels.baseUrlHint}</p>}
          </div>
        </div>
      )}
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-[32px] px-6 py-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <button onClick={onToggleAdvancedSettings} className="w-full flex items-center justify-between">
        <h3 className="text-lg font-bold dark:text-white">Advanced</h3>
        <ChevronRight size={20} className={`text-gray-400 transition-transform duration-300 ${showAdvancedSettings ? 'rotate-90' : ''}`} />
      </button>

      {showAdvancedSettings && (
        <div className="mt-6 space-y-4 animate-fade-in-down">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Custom Server URL</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><LinkIcon size={18} /></div>
              <input type="text" value={customApiUrl} onChange={(event) => onSetCustomApiUrl(event.target.value)} placeholder="" className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white text-xs" />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
              Use Cloudflare Tunnel or Proxy. Leave empty for default.
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="pt-2">
      <button onClick={onLogout} className="w-full py-4 bg-white dark:bg-gray-800 text-red-500 rounded-[32px] font-bold text-sm shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2">
        <LogOut size={18} />
        {labels.logout}
      </button>
    </div>
  </div>
);
