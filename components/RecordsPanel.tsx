import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import type { PaymentRecord } from '../types';

type RecordsPanelProps = {
  labels: {
    rechargeRecords: string;
  };
  records: PaymentRecord[];
  formatMoney: (value: number) => string;
};

export const RecordsPanel = ({ labels, records, formatMoney }: RecordsPanelProps) => (
  <div className="space-y-4 animate-fade-in pb-20">
    <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700/50">
        <h3 className="font-bold text-lg dark:text-white">{labels.rechargeRecords}</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {records.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">No transaction history</div>
        ) : (
          records.map((record, index) => (
            <div key={index} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group cursor-default">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${record.dataValue > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {record.dataValue > 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{record.paymentType}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {new Date(record.logTime).toLocaleDateString()} · {new Date(record.logTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${record.dataValue > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {record.dataValue > 0 ? '+' : ''}
                  {formatMoney(record.dataValue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);
