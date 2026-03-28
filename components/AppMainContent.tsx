import { DesktopPageHeader } from './DesktopPageHeader.js';
import { OverviewContent } from './OverviewContent.js';
import { RecordsPanel } from './RecordsPanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { TrendsPanel } from './TrendsPanel.js';

type AppMainContentProps = {
  labels: any;
  activeTab: 'overview' | 'trends' | 'records' | 'settings';
  weather: any;
  isLoading: boolean;
  onRefresh: () => void;
  overview: any;
  dailyBrief: string;
  displayUnit: 'money' | 'unit';
  totalSubsidyMoney: number;
  balanceStatus: {
    textClass: string;
    statusText: string;
    dotClass: string;
  };
  formatMoney: (value: number) => string;
  onSetDisplayUnit: (value: 'money' | 'unit') => void;
  onOpenCalculator: () => void;
  chartDate: Date;
  chartData: any[];
  isDark: boolean;
  enableAI: boolean;
  trendAnalysis: string;
  isTrendAiLoading: boolean;
  onChangeMonth: (offset: number) => void;
  onGenerateAnalysis: () => void;
  onResetAnalysis: () => void;
  records: any[];
  lang: 'zh' | 'en';
  currency: 'CNY' | 'USD';
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
      title={labels[activeTab]}
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
