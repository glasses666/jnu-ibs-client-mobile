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
  type RechargeCalculatorModalProps,
} from './RechargeCalculatorModal.js';

type AppShellNavigationProps = {
  room?: string;
  weather: AppMainContentProps['weather'];
  isLoading: boolean;
  activeTab: ActiveTab;
  onSetActiveTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export type AppShellProps = {
  labels: AppMainContentProps['labels'] & RechargeCalculatorLabels & NavigationLabels;
  navigation: AppShellNavigationProps;
  calculator: Omit<RechargeCalculatorModalProps, 'labels'>;
  content: Omit<AppMainContentProps, 'labels'>;
};

export const AppShell = ({
  labels,
  navigation,
  calculator,
  content,
}: AppShellProps) => (
  <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] dark:bg-black text-gray-900 dark:text-gray-100 transition-colors overflow-hidden font-sans selection:bg-primary/20">
    <RechargeCalculatorModal
      labels={labels}
      {...calculator}
    />

    <DesktopSidebar
      labels={labels}
      room={navigation.room}
      activeTab={navigation.activeTab}
      onSetActiveTab={navigation.onSetActiveTab}
      onLogout={navigation.onLogout}
    />

    <MobileHeader
      room={navigation.room}
      weather={navigation.weather}
      isLoading={navigation.isLoading}
      onRefresh={navigation.onRefresh}
    />

    <main className="flex-1 lg:pl-80 pt-14 lg:pt-0 pb-28 lg:pb-8 overflow-y-auto no-scrollbar">
      <div className="p-5 md:p-10 max-w-6xl mx-auto min-h-full">
        <AppMainContent
          labels={labels}
          {...content}
        />
      </div>
    </main>

    <MobileBottomNav
      activeTab={navigation.activeTab}
      onSetActiveTab={navigation.onSetActiveTab}
    />
  </div>
);
