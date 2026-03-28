import type { ActiveTab } from '../types.js';
import {
  DesktopSidebar,
  MobileBottomNav,
  MobileHeader,
  type NavigationLabels,
} from './AppNavigation.js';
import {
  AppMainContent,
  type AppMainContentProps,
} from './AppMainContent.js';
import {
  RechargeCalculatorModal,
  type RechargeCalculatorLabels,
} from './RechargeCalculatorModal.js';

type AppShellProps = Omit<AppMainContentProps, 'labels'> & {
  labels: AppMainContentProps['labels'] & RechargeCalculatorLabels & NavigationLabels;
  room?: string;
  onSetActiveTab: (tab: ActiveTab) => void;
  isCalculatorOpen: boolean;
  balance: number;
  roommates: number;
  daysToCover: number;
  canCalculateRecharge: boolean;
  isCalcLoading: boolean;
  calcResult: string;
  onCloseCalculator: () => void;
  onRoommatesChange: (value: number) => void;
  onDaysToCoverChange: (value: number) => void;
  onCalculateRecharge: () => void;
};

export const AppShell = ({
  labels,
  room,
  weather,
  isLoading,
  activeTab,
  onSetActiveTab,
  onRefresh,
  onLogout,
  isCalculatorOpen,
  balance,
  formatMoney,
  roommates,
  daysToCover,
  canCalculateRecharge,
  isCalcLoading,
  calcResult,
  onCloseCalculator,
  onRoommatesChange,
  onDaysToCoverChange,
  onCalculateRecharge,
  overview,
  dailyBrief,
  displayUnit,
  totalSubsidyMoney,
  balanceStatus,
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
}: AppShellProps) => (
  <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] dark:bg-black text-gray-900 dark:text-gray-100 transition-colors overflow-hidden font-sans selection:bg-primary/20">
    <RechargeCalculatorModal
      isOpen={isCalculatorOpen}
      labels={labels}
      balance={balance}
      formatMoney={formatMoney}
      roommates={roommates}
      daysToCover={daysToCover}
      canCalculate={canCalculateRecharge}
      isCalcLoading={isCalcLoading}
      calcResult={calcResult}
      onClose={onCloseCalculator}
      onRoommatesChange={onRoommatesChange}
      onDaysToCoverChange={onDaysToCoverChange}
      onCalculate={onCalculateRecharge}
    />

    <DesktopSidebar
      labels={labels}
      room={room}
      activeTab={activeTab}
      onSetActiveTab={onSetActiveTab}
      onLogout={onLogout}
    />

    <MobileHeader
      room={room}
      weather={weather}
      isLoading={isLoading}
      onRefresh={onRefresh}
    />

    <main className="flex-1 lg:pl-80 pt-14 lg:pt-0 pb-28 lg:pb-8 overflow-y-auto no-scrollbar">
      <div className="p-5 md:p-10 max-w-6xl mx-auto min-h-full">
        <AppMainContent
          labels={labels}
          activeTab={activeTab}
          weather={weather}
          isLoading={isLoading}
          onRefresh={onRefresh}
          overview={overview}
          dailyBrief={dailyBrief}
          displayUnit={displayUnit}
          totalSubsidyMoney={totalSubsidyMoney}
          balanceStatus={balanceStatus}
          formatMoney={formatMoney}
          onSetDisplayUnit={onSetDisplayUnit}
          onOpenCalculator={onOpenCalculator}
          chartDate={chartDate}
          chartData={chartData}
          isDark={isDark}
          enableAI={enableAI}
          trendAnalysis={trendAnalysis}
          isTrendAiLoading={isTrendAiLoading}
          onChangeMonth={onChangeMonth}
          onGenerateAnalysis={onGenerateAnalysis}
          onResetAnalysis={onResetAnalysis}
          records={records}
          lang={lang}
          currency={currency}
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
      </div>
    </main>

    <MobileBottomNav
      activeTab={activeTab}
      onSetActiveTab={onSetActiveTab}
    />
  </div>
);
