import { Preferences } from '@capacitor/preferences';

export const StorageKeys = {
  THEME: 'theme',
  LANG: 'lang',
  AI_CONFIG: 'ai_config',
  CURRENCY: 'currency' // Added CURRENCY
};

export const saveConfig = async (key: string, value: any) => {
  await Preferences.set({
    key,
    value: JSON.stringify(value),
  });
};

export const loadConfig = async <T>(key: string, defaultValue: T): Promise<T> => {
  const { value } = await Preferences.get({ key });
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};
