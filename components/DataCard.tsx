import React from 'react';
import { CountUp } from './CountUp';

interface DataCardProps {
  title: string;
  value?: string | number;
  animatedValue?: number;
  formatFn?: (val: number) => string;
  subValue?: string;
  subsidy?: string; 
  icon: React.ReactNode;
  colorClass: string; 
  trend?: string; 
  onClick?: () => void;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  animatedValue,
  formatFn,
  subValue,
  subsidy,
  icon,
  colorClass,
  trend,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-3xl p-5 flex flex-col justify-between h-full shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-transform active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClass.split(' ')[1]} dark:bg-opacity-10`}>
          <div className={`${colorClass.split(' ')[0]} dark:text-white opacity-90`}>
            {icon}
          </div>
        </div>
        {trend && (
           <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
             {trend}
           </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {typeof animatedValue === 'number' ? (
                <CountUp value={animatedValue} formatter={formatFn} />
            ) : (
                value
            )}
        </h3>
        <div className="flex flex-col mt-1 gap-0.5">
           <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{title}</p>
              {subValue && (
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{subValue}</p>
              )}
           </div>
           {subsidy && (
             <div className="flex justify-end">
                <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                  补: {subsidy}
                </span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DataCard;