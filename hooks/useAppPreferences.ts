import { useEffect, useState } from 'react';

import { ibsService } from '../services/ibsService';
import { saveConfig, StorageKeys } from '../services/storageService';
import { Language, type AIProvider } from '../types';
import {
  createPersistedAiConfig,
  getCompatibleModelForProvider,
  loadPersistedPreferences,
} from '../utils/appPreferences';

export const useAppPreferences = () => {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Language>(Language.ZH);
  const [enableAI, setEnableAI] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('google');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

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

    void init();
  }, []);

  useEffect(() => {
    saveConfig(StorageKeys.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    saveConfig(StorageKeys.LANG, lang);
  }, [lang]);

  useEffect(() => {
    saveConfig(StorageKeys.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    saveConfig(StorageKeys.CUSTOM_API_URL, customApiUrl);
    ibsService.setBaseUrl(customApiUrl);
  }, [customApiUrl]);

  useEffect(() => {
    saveConfig(
      StorageKeys.AI_CONFIG,
      createPersistedAiConfig({
        enableAI,
        apiKey,
        aiBaseUrl,
        aiProvider,
        aiModel,
      })
    );
  }, [enableAI, apiKey, aiBaseUrl, aiProvider, aiModel]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    setAiModel((current) => getCompatibleModelForProvider(aiProvider, current));
  }, [aiProvider]);

  return {
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
  };
};
