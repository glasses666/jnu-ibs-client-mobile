import { loadConfig, StorageKeys } from '../services/storageService.js';
import { Language, type AIProvider } from '../types.js';

type Currency = 'CNY' | 'USD';

export type PersistedAiConfig = {
  enableAI: boolean;
  apiKey: string;
  baseUrl?: string;
  provider?: AIProvider;
  model?: string;
};

type HydratePersistedPreferencesArgs = {
  theme: string;
  lang: Language;
  currency: Currency;
  customApiUrl: string;
  aiConfig: PersistedAiConfig;
};

type PersistAiConfigArgs = {
  enableAI: boolean;
  apiKey: string;
  aiBaseUrl: string;
  aiProvider: AIProvider;
  aiModel: string;
};

type AiFeatureConfigArgs = {
  enableAI: boolean;
  apiKey: string;
  aiBaseUrl: string;
  aiProvider: AIProvider;
};

const defaultPersistedAiConfig: PersistedAiConfig = {
  enableAI: false,
  apiKey: '',
  provider: 'google',
};

export const getCompatibleModelForProvider = (provider: AIProvider, model: string) => {
  if (provider === 'google' && model === 'qwen-plus') {
    return 'gemini-2.5-flash';
  }

  if (provider === 'openai' && model === 'gemini-2.5-flash') {
    return 'qwen-plus';
  }

  return model;
};

export const hydratePersistedPreferences = ({
  theme,
  lang,
  currency,
  customApiUrl,
  aiConfig,
}: HydratePersistedPreferencesArgs) => ({
  isDark: theme === 'dark',
  lang,
  currency,
  customApiUrl,
  ai: {
    enableAI: aiConfig.apiKey ? aiConfig.enableAI : false,
    apiKey: aiConfig.apiKey || '',
    aiProvider: aiConfig.provider || 'google',
    aiBaseUrl: aiConfig.baseUrl || '',
    aiModel: aiConfig.apiKey ? (aiConfig.model || '') : 'gemini-2.5-flash',
  },
});

export const createPersistedAiConfig = ({
  enableAI,
  apiKey,
  aiBaseUrl,
  aiProvider,
  aiModel,
}: PersistAiConfigArgs): PersistedAiConfig => ({
  enableAI,
  apiKey,
  baseUrl: aiBaseUrl,
  provider: aiProvider,
  model: aiModel,
});

export const isAiFeatureConfigured = ({
  enableAI,
  apiKey,
  aiBaseUrl,
  aiProvider,
}: AiFeatureConfigArgs) => {
  if (!enableAI || !apiKey.trim()) {
    return false;
  }

  if (aiProvider === 'openai' && !aiBaseUrl.trim()) {
    return false;
  }

  return true;
};

export const loadPersistedPreferences = async () => {
  const [theme, lang, aiConfig, currency, customApiUrl] = await Promise.all([
    loadConfig(StorageKeys.THEME, 'light'),
    loadConfig(StorageKeys.LANG, Language.ZH),
    loadConfig<PersistedAiConfig>(StorageKeys.AI_CONFIG, defaultPersistedAiConfig),
    loadConfig<Currency>(StorageKeys.CURRENCY, 'CNY'),
    loadConfig(StorageKeys.CUSTOM_API_URL, ''),
  ]);

  return hydratePersistedPreferences({
    theme,
    lang: lang as Language,
    currency: currency as Currency,
    customApiUrl,
    aiConfig,
  });
};
