type RawEnv = Record<string, string | undefined> | undefined;

export const DEFAULT_API_BASE_URL = 'https://pynhcx.jnu.edu.cn/IBSjnuweb/WebService/JNUService.asmx/';

const trimToUndefined = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const normalizeBaseUrl = (value?: string, fallback: string = DEFAULT_API_BASE_URL) => {
  const normalized = trimToUndefined(value) ?? fallback;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
};

export const createAppConfig = (env: RawEnv = {}) => {
  const supabaseUrl = trimToUndefined(env?.VITE_SUPABASE_URL) ?? '';
  const supabaseAnonKey = trimToUndefined(env?.VITE_SUPABASE_ANON_KEY) ?? '';
  const weatherApiId = trimToUndefined(env?.VITE_WEATHER_API_ID) ?? '';
  const weatherApiKey = trimToUndefined(env?.VITE_WEATHER_API_KEY) ?? '';

  return {
    apiBaseUrl: normalizeBaseUrl(env?.VITE_API_BASE_URL),
    supabaseUrl,
    supabaseAnonKey,
    weatherApiId,
    weatherApiKey,
    cloudAuthEnabled: Boolean(supabaseUrl && supabaseAnonKey),
    weatherEnabled: Boolean(weatherApiId && weatherApiKey),
  };
};

type ImportMetaEnvLike = {
  env?: Record<string, string | undefined>;
};

const runtimeImportMeta = import.meta as ImportMetaEnvLike;

export const appConfig = createAppConfig(runtimeImportMeta.env);
