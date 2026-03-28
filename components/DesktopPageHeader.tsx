import { RefreshCw } from 'lucide-react';

import type { WeatherData } from '../services/weatherService';

type DesktopPageHeaderProps = {
  title: string;
  refreshLabel: string;
  isLoading: boolean;
  weather: WeatherData | null;
  onRefresh: () => void;
};

export const DesktopPageHeader = ({
  title,
  refreshLabel,
  isLoading,
  weather,
  onRefresh,
}: DesktopPageHeaderProps) => (
  <header className="hidden lg:flex justify-between items-end mb-10 pt-4">
    <div>
      <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{title}</h2>
      <div className="flex items-center gap-3 mt-2">
        <p className="text-gray-400 font-medium">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {weather && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span>{weather.place}</span>
            <span>{weather.weather}</span>
            <span>{weather.temperature}°C</span>
          </div>
        )}
      </div>
    </div>

    <button
      onClick={onRefresh}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-500 hover:text-primary border border-gray-100 dark:border-gray-700 shadow-sm transition-all"
    >
      <RefreshCw
        size={18}
        className={`transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}
      />
      <span className="font-bold text-xs uppercase tracking-wider">{refreshLabel}</span>
    </button>
  </header>
);
