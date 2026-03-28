import { Calculator, Droplet, Flame, Zap } from 'lucide-react';

import type { OverviewData } from '../types';
import { CountUp } from './CountUp.js';
import DataCard from './DataCard.js';

type OverviewLabels = {
  balance: string;
  totalCost: string;
  subsidyLabel: string;
  showMoney: string;
  showUnit: string;
  electricity: string;
  coldWater: string;
  hotWater: string;
  unitKwh: string;
  unitM3: string;
};

type OverviewContentProps = {
  labels: OverviewLabels;
  overview: OverviewData | null;
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
  onRefresh: () => void;
};

export const OverviewContent = ({
  labels,
  overview,
  dailyBrief,
  displayUnit,
  totalSubsidyMoney,
  balanceStatus,
  formatMoney,
  onSetDisplayUnit,
  onOpenCalculator,
  onRefresh,
}: OverviewContentProps) => {
  if (!overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-[32px] bg-gray-200 dark:bg-gray-800 h-[220px] p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-10 w-48 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white dark:bg-gray-800 rounded-3xl p-5 h-32 flex flex-col justify-between border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="w-12 h-5 rounded-full bg-gray-100 dark:bg-gray-700"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {dailyBrief && (
        <div className="animate-fade-in mb-2 px-2">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 italic flex items-center gap-2">
            <span>👋</span>
            <span>{dailyBrief}</span>
          </p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[32px] bg-gray-900 dark:bg-gray-800 text-white p-8 shadow-2xl shadow-gray-900/20 dark:shadow-none min-h-[220px] flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 -mr-16 -mt-16 pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${balanceStatus.dotClass}`}></div>
              <p className="text-sm font-bold text-gray-300 dark:text-gray-400">{balanceStatus.statusText}</p>
            </div>
            <p className="text-gray-400 font-medium text-sm uppercase tracking-widest mb-1">{labels.balance}</p>
            <h3 className={`text-5xl font-black tracking-tighter ${balanceStatus.textClass}`}>
              <CountUp value={overview.balance} formatter={formatMoney} />
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onOpenCalculator}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-90 group/calc"
            >
              <Calculator size={24} className="text-white opacity-80 group-hover/calc:opacity-100" />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
          <div className="flex gap-8 md:gap-12">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{labels.totalCost}</p>
              <p className="text-xl font-bold">
                <CountUp value={overview.costs.total} formatter={formatMoney} />
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{labels.subsidyLabel}</p>
              <p className={`text-xl font-bold ${totalSubsidyMoney > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <CountUp value={totalSubsidyMoney} formatter={formatMoney} />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 animate-fade-in-up delay-100">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex transition-colors duration-300">
          <button
            onClick={() => onSetDisplayUnit('money')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${displayUnit === 'money' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
          >
            {labels.showMoney}
          </button>
          <button
            onClick={() => onSetDisplayUnit('unit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${displayUnit === 'unit' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
          >
            {labels.showUnit}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-200">
        <DataCard
          title={labels.electricity}
          animatedValue={displayUnit === 'money' ? overview.costs.elec : overview.details.elec[0]}
          formatFn={displayUnit === 'money' ? formatMoney : (value) => `${value.toFixed(2)} ${labels.unitKwh}`}
          subValue={displayUnit === 'money' ? `${overview.details.elec[0]} ${labels.unitKwh}` : formatMoney(overview.costs.elec)}
          subsidy={displayUnit === 'money' ? formatMoney(overview.subsidyMoney?.elec || 0) : `${overview.subsidy?.elec || 0} ${labels.unitKwh}`}
          subsidyVariant={(overview.subsidy?.elec || 0) > 0 ? 'success' : 'danger'}
          icon={<Zap size={22} />}
          colorClass="text-yellow-600 bg-yellow-400"
          trend="+2.4%"
          onClick={onRefresh}
        />
        <DataCard
          title={labels.coldWater}
          animatedValue={displayUnit === 'money' ? overview.costs.cold : overview.details.cold[0]}
          formatFn={displayUnit === 'money' ? formatMoney : (value) => `${value.toFixed(2)} ${labels.unitM3}`}
          subValue={displayUnit === 'money' ? `${overview.details.cold[0]} ${labels.unitM3}` : formatMoney(overview.costs.cold)}
          subsidy={displayUnit === 'money' ? formatMoney(overview.subsidyMoney?.cold || 0) : `${overview.subsidy?.cold || 0} ${labels.unitM3}`}
          subsidyVariant={(overview.subsidy?.cold || 0) > 0 ? 'success' : 'danger'}
          icon={<Droplet size={22} />}
          colorClass="text-blue-600 bg-blue-400"
          trend="-0.5%"
          onClick={onRefresh}
        />
        <DataCard
          title={labels.hotWater}
          animatedValue={displayUnit === 'money' ? overview.costs.hot : overview.details.hot[0]}
          formatFn={displayUnit === 'money' ? formatMoney : (value) => `${value.toFixed(2)} ${labels.unitM3}`}
          subValue={displayUnit === 'money' ? `${overview.details.hot[0]} ${labels.unitM3}` : formatMoney(overview.costs.hot)}
          subsidy={displayUnit === 'money' ? formatMoney(overview.subsidyMoney?.hot || 0) : `${overview.subsidy?.hot || 0} ${labels.unitM3}`}
          subsidyVariant={(overview.subsidy?.hot || 0) > 0 ? 'success' : 'danger'}
          icon={<Flame size={22} />}
          colorClass="text-orange-600 bg-orange-400"
          onClick={onRefresh}
        />
      </div>
    </div>
  );
};
