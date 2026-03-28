import type { FormEventHandler } from 'react';
import { Cloud, Globe, Moon, Sun, X, Zap } from 'lucide-react';

type LoginScreenProps = {
  labels: {
    login: string;
    title: string;
    roomPlaceholder: string;
    loading: string;
    tryDemo: string;
  };
  apiBaseUrl: string;
  isCloudAuthEnabled: boolean;
  isDark: boolean;
  isLoading: boolean;
  loginRoom: string;
  errorMsg: string;
  customApiUrl: string;
  showServerConfig: boolean;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onShowCloudAuth: () => void;
  onShowServerConfig: () => void;
  onHideServerConfig: () => void;
  onCustomApiUrlChange: (value: string) => void;
  onLoginRoomChange: (value: string) => void;
  onLogin: FormEventHandler<HTMLFormElement>;
  onEnterDemoMode: () => void;
};

export const LoginScreen = ({
  labels,
  apiBaseUrl,
  isCloudAuthEnabled,
  isDark,
  isLoading,
  loginRoom,
  errorMsg,
  customApiUrl,
  showServerConfig,
  onToggleLang,
  onToggleTheme,
  onShowCloudAuth,
  onShowServerConfig,
  onHideServerConfig,
  onCustomApiUrlChange,
  onLoginRoomChange,
  onLogin,
  onEnterDemoMode,
}: LoginScreenProps) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[#f2f4f6] dark:bg-gray-900 transition-colors">
    {showServerConfig && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-sm p-6 shadow-2xl animate-pop-in border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg dark:text-white">Server Settings</h3>
            <button onClick={onHideServerConfig} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Custom API URL</label>
              <input
                type="text"
                value={customApiUrl}
                onChange={(event) => onCustomApiUrlChange(event.target.value)}
                placeholder={apiBaseUrl}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium dark:text-white text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                Configure this if you are accessing via Cloudflare Tunnel or external proxy.
              </p>
            </div>
            <button
              onClick={onHideServerConfig}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] p-8 border border-white/50 dark:border-gray-700 relative">
      {isCloudAuthEnabled && (
        <button
          aria-label="Cloud login"
          onClick={onShowCloudAuth}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Cloud size={20} />
        </button>
      )}

      <div className="flex justify-between items-center mb-10">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
          <Zap size={24} fill="currentColor" />
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleLang} className="p-2.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors">
            <Globe size={18} />
          </button>
          <button onClick={onToggleTheme} className="p-2.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <h2 className="text-3xl font-black mb-3 dark:text-white tracking-tight">{labels.login}</h2>
      <p className="text-gray-400 mb-8 font-medium">{labels.title}</p>

      <form onSubmit={onLogin} className="space-y-4">
        <input
          type="text"
          value={loginRoom}
          onChange={(event) => onLoginRoomChange(event.target.value)}
          placeholder={labels.roomPlaceholder}
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
              {labels.loading}
            </div>
          ) : labels.login}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={onEnterDemoMode}
          className="text-xs font-bold text-gray-400 hover:text-primary transition-colors tracking-wide uppercase"
        >
          {labels.tryDemo}
        </button>
        <button
          onClick={onShowServerConfig}
          className="text-[10px] font-bold text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors uppercase"
        >
          Server Config
        </button>
      </div>
    </div>
  </div>
);
