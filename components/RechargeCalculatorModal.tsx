import { Bot, Calculator, Copy, X } from 'lucide-react';

import { MarkdownText } from './MarkdownText.js';

type RechargeCalculatorLabels = {
  calcTitle: string;
  calcDesc: string;
  balance: string;
  roommates: string;
  daysToCover: string;
  generatePlan: string;
  configureAi: string;
};

type RechargeCalculatorModalProps = {
  isOpen: boolean;
  labels: RechargeCalculatorLabels;
  balance: number;
  formatMoney: (value: number) => string;
  roommates: number;
  daysToCover: number;
  enableAI: boolean;
  isCalcLoading: boolean;
  calcResult: string;
  onClose: () => void;
  onRoommatesChange: (value: number) => void;
  onDaysToCoverChange: (value: number) => void;
  onCalculate: () => void;
};

export const RechargeCalculatorModal = ({
  isOpen,
  labels,
  balance,
  formatMoney,
  roommates,
  daysToCover,
  enableAI,
  isCalcLoading,
  calcResult,
  onClose,
  onRoommatesChange,
  onDaysToCoverChange,
  onCalculate,
}: RechargeCalculatorModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-md p-6 shadow-2xl scale-100 animate-pop-in border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{labels.calcTitle}</h3>
              <p className="text-xs text-gray-400">{labels.calcDesc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto no-scrollbar">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl flex justify-between items-center">
            <span className="font-bold text-gray-500">{labels.balance}</span>
            <span className="font-black text-2xl">{formatMoney(balance)}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">{labels.roommates}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="8"
                value={roommates}
                onChange={(event) => onRoommatesChange(parseInt(event.target.value, 10))}
                className="flex-1 accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="font-bold text-xl w-8 text-center">{roommates}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">{labels.daysToCover}</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="7"
                max="90"
                step="1"
                value={daysToCover}
                onChange={(event) => onDaysToCoverChange(parseInt(event.target.value, 10))}
                className="flex-1 accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="font-bold text-xl w-10 text-center">{daysToCover}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-1 font-medium">
              <span>7 Days</span>
              <span>90 Days</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onCalculate}
              disabled={isCalcLoading || !enableAI}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isCalcLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Bot size={18} />
              )}
              {enableAI ? labels.generatePlan : labels.configureAi}
            </button>
          </div>

          {calcResult && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">AI Plan</span>
                <button
                  onClick={() => navigator.clipboard.writeText(calcResult)}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
                <MarkdownText content={calcResult} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
