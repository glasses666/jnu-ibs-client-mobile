import type { WeatherData } from '../services/weatherService.js';
import type { ActiveTab, AIProvider, OverviewData, PaymentRecord } from '../types.js';
import type { TrendChartDatum } from '../utils/dashboardPresentation.js';
import { DesktopPageHeader } from './DesktopPageHeader.js';
import { OverviewContent } from './OverviewContent.js';
import { RecordsPanel } from './RecordsPanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { TrendsPanel } from './TrendsPanel.js';

export type BalanceStatus = {
  textClass: string;
  statusText: string;
  dotClass: string;
};

export type AppMainContentLabels = {
  dashboard: string;
  trends: string;
  records: string;
  settings: string;
  refresh: string;
  balance: string;
  totalCost: string;
  subsidyLabel: string;
  rechargeRecords: string;
  showMoney: string;
  showUnit: string;
  electricity: string;
  coldWater: string;
  hotWater: string;
  unitKwh: string;
  unitM3: string;
  estimatedToday: string;
  trendAnalysisTitle: string;
  generateAnalysis: string;
  analysisNotEnabled: string;
  analysisPlaceholder: string;
  regenerate: string;
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

const TAB_TITLE_KEYS = {
  overview: 'dashboard',
  trends: 'trends',
  records: 'records',
  settings: 'settings',
} as const satisfies Record<ActiveTab, keyof Pick<AppMainContentLabels, 'dashboard' | 'trends' | 'records' | 'settings'>>;

export type AppMainContentProps = {
  labels: AppMainContentLabels;
  activeTab: ActiveTab;
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  overview: OverviewData | null;
  dailyBrief: string;
  displayUnit: 'money' | 'unit';
  totalSubsidyMoney: number;
  balanceStatus: BalanceStatus;
  formatMoney: (value: number) => string;
  onSetDisplayUnit: (value: 'money' | 'unit') => void;
  onOpenCalculator: () => void;
  chartDate: Date;
  chartData: TrendChartDatum[];
  isDark: boolean;
  enableAI: boolean;
  trendAnalysis: string;
  isTrendAiLoading: boolean;
  onChangeMonth: (offset: number) => void;
  onGenerateAnalysis: () => void;
  onResetAnalysis: () => void;
  records: PaymentRecord[];
  lang: 'zh' | 'en';
  currency: 'CNY' | 'USD';
  aiProvider: AIProvider;
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

export const AppMainContent = ({
  labels,
  activeTab,
  weather,
  isLoading,
  onRefresh,
  overview,
  dailyBrief,
  displayUnit,
  totalSubsidyMoney,
  balanceStatus,
  formatMoney,
  onSetDisplayUnit,
  onOpenCalculator,
  chartDate,
  chartData,
  isDark,
  enableAI,
  trendAnalysis,
  isTrendAiLoading,
  onChangeMonth,
  onGenerateAnalysis,
  onResetAnalysis,
  records,
  lang,
  currency,
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
}: AppMainContentProps) => (
  <>
    <DesktopPageHeader
      title={labels[TAB_TITLE_KEYS[activeTab]]}
      refreshLabel={labels.refresh}
      isLoading={isLoading}
      weather={weather}
      onRefresh={onRefresh}
    />

    {activeTab === 'overview' && (
      <OverviewContent
        labels={labels}
        overview={overview}
        dailyBrief={dailyBrief}
        displayUnit={displayUnit}
        totalSubsidyMoney={totalSubsidyMoney}
        balanceStatus={balanceStatus}
        formatMoney={formatMoney}
        onSetDisplayUnit={onSetDisplayUnit}
        onOpenCalculator={onOpenCalculator}
        onRefresh={onRefresh}
      />
    )}

    {activeTab === 'trends' && (
      <TrendsPanel
        labels={labels}
        chartDate={chartDate}
        chartData={chartData}
        isDark={isDark}
        enableAI={enableAI}
        trendAnalysis={trendAnalysis}
        isTrendAiLoading={isTrendAiLoading}
        onChangeMonth={onChangeMonth}
        onGenerateAnalysis={onGenerateAnalysis}
        onResetAnalysis={onResetAnalysis}
      />
    )}

    {activeTab === 'records' && (
      <RecordsPanel
        labels={labels}
        records={records}
        formatMoney={formatMoney}
      />
    )}

    {activeTab === 'settings' && (
      <SettingsPanel
        labels={labels}
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
        onSetLang={onSetLang}
        onToggleDarkMode={onToggleDarkMode}
        onSetCurrency={onSetCurrency}
        onToggleAI={onToggleAI}
        onSetAiProvider={onSetAiProvider}
        onSetApiKey={onSetApiKey}
        onSetAiModel={onSetAiModel}
        onSetAiBaseUrl={onSetAiBaseUrl}
        onToggleAdvancedSettings={onToggleAdvancedSettings}
        onSetCustomApiUrl={onSetCustomApiUrl}
        onLogout={onLogout}
      />
    )}
  </>
);
