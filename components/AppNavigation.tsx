import type { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Activity,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react';

import type { WeatherData } from '../services/weatherService';
import type { ActiveTab } from '../types';

export type { ActiveTab } from '../types';

type NavigationLabels = {
  dashboard: string;
  trends: string;
  records: string;
  settings: string;
  logout: string;
};

type DesktopSidebarProps = {
  labels: NavigationLabels;
  room?: string;
  activeTab: ActiveTab;
  onSetActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
};

type MobileHeaderProps = {
  room?: string;
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
};

type MobileBottomNavProps = {
  activeTab: ActiveTab;
  onSetActiveTab: (tab: ActiveTab) => void;
  platform?: string;
};

type SidebarItemProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

type MobileNavItemProps = {
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
};

const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm mb-1 ${active ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
  >
    <div className={active ? 'text-primary' : ''}>{icon}</div>
    <span>{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-gray-400" />}
  </button>
);

const MobileNavItem = ({ icon, active, onClick }: MobileNavItemProps) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-300 active:scale-90 ${active ? 'text-primary dark:text-white bg-primary/10 dark:bg-white/10' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
  >
    {icon}
  </button>
);

export const DesktopSidebar = ({
  labels,
  room,
  activeTab,
  onSetActiveTab,
  onLogout,
}: DesktopSidebarProps) => (
  <aside className="hidden lg:flex flex-col w-80 fixed inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50">
    <div className="p-8 pb-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Zap size={20} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">IBS Client</h1>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {room?.substring(0, 1) || 'R'}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Room</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{room}</p>
          </div>
        </div>
      </div>
    </div>

    <nav className="flex-1 px-4 space-y-1">
      <SidebarItem icon={<LayoutDashboard size={20} />} label={labels.dashboard} active={activeTab === 'overview'} onClick={() => onSetActiveTab('overview')} />
      <SidebarItem icon={<Activity size={20} />} label={labels.trends} active={activeTab === 'trends'} onClick={() => onSetActiveTab('trends')} />
      <SidebarItem icon={<History size={20} />} label={labels.records} active={activeTab === 'records'} onClick={() => onSetActiveTab('records')} />
      <div className="pt-4 mt-4 border-t border-gray-50 dark:border-gray-800/50">
        <SidebarItem icon={<Settings size={20} />} label={labels.settings} active={activeTab === 'settings'} onClick={() => onSetActiveTab('settings')} />
      </div>
    </nav>

    <div className="p-6">
      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 w-full p-3 rounded-2xl transition-colors font-bold text-sm"
      >
        <LogOut size={16} />
        <span>{labels.logout}</span>
      </button>
    </div>
  </aside>
);

export const MobileHeader = ({
  room,
  weather,
  isLoading,
  onRefresh,
}: MobileHeaderProps) => (
  <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-40 flex items-center justify-between px-4 transition-all duration-300">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xs">
        {room?.substring(0, 1) || 'R'}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-sm tracking-tight leading-tight">{room}</span>
        {weather && (
          <span className="text-[10px] font-medium text-gray-400 leading-tight">
            {weather.weather} {weather.temperature}°
          </span>
        )}
      </div>
    </div>
    <button onClick={onRefresh} className={`p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 ${isLoading ? 'animate-spin' : ''}`}>
      <RefreshCw size={20} />
    </button>
  </div>
);

export const MobileBottomNav = ({
  activeTab,
  onSetActiveTab,
  platform = Capacitor.getPlatform(),
}: MobileBottomNavProps) => (
  <div
    className={`lg:hidden fixed bottom-6 left-4 right-4 border border-gray-200 dark:border-white/10 rounded-2xl z-50 p-2 flex justify-between items-center transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${platform === 'ios' ? 'ios-liquid-glass' : 'bg-white/90 dark:bg-gray-950/85 backdrop-blur-xl'}`}
  >
    <MobileNavItem icon={<LayoutDashboard size={22} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />} active={activeTab === 'overview'} onClick={() => onSetActiveTab('overview')} />
    <MobileNavItem icon={<Activity size={22} strokeWidth={activeTab === 'trends' ? 2.5 : 2} />} active={activeTab === 'trends'} onClick={() => onSetActiveTab('trends')} />
    <MobileNavItem icon={<History size={22} strokeWidth={activeTab === 'records' ? 2.5 : 2} />} active={activeTab === 'records'} onClick={() => onSetActiveTab('records')} />
    <MobileNavItem icon={<Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />} active={activeTab === 'settings'} onClick={() => onSetActiveTab('settings')} />
  </div>
);
