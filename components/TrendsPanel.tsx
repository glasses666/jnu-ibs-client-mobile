import { BrainCircuit, ChevronRight, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { TrendChartDatum } from '../utils/dashboardPresentation';
import { MarkdownText } from './MarkdownText.js';

type TrendsLabels = {
  trends: string;
  electricity: string;
  coldWater: string;
  hotWater: string;
  estimatedToday: string;
  trendAnalysisTitle: string;
  generateAnalysis: string;
  analysisNotEnabled: string;
  analysisPlaceholder: string;
  regenerate: string;
};

type TrendsPanelProps = {
  labels: TrendsLabels;
  chartDate: Date;
  chartData: TrendChartDatum[];
  isDark: boolean;
  enableAI: boolean;
  trendAnalysis: string;
  isTrendAiLoading: boolean;
  onChangeMonth: (offset: number) => void;
  onGenerateAnalysis: () => void;
  onResetAnalysis: () => void;
};

type CustomLegendProps = {
  estimatedToday: string;
  payload?: Array<{
    color?: string;
    value?: string;
  }>;
};

const CustomLegend = ({ estimatedToday, payload = [] }: CustomLegendProps) => (
  <div className="flex justify-center gap-4 sm:gap-8 mt-6 flex-wrap px-2">
    {payload.map((entry, index) => (
      <div key={`item-${index}`} className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
        <div
          className="w-2 h-2 rounded-full ring-2 ring-opacity-20 ring-offset-1 dark:ring-offset-gray-800 shrink-0"
          style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }}
        />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {entry.value}
        </span>
      </div>
    ))}
    <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
      <div className="w-4 h-0 border-t-2 border-dashed border-gray-400 opacity-50"></div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {estimatedToday}
      </span>
    </div>
  </div>
);

const canMoveToNextMonth = (chartDate: Date) =>
  new Date(chartDate).setMonth(chartDate.getMonth() + 1) <= Date.now();

export const TrendsPanel = ({
  labels,
  chartDate,
  chartData,
  isDark,
  enableAI,
  trendAnalysis,
  isTrendAiLoading,
  onChangeMonth,
  onGenerateAnalysis,
  onResetAnalysis,
}: TrendsPanelProps) => (
  <div className="space-y-6 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-[0_2px_20px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 h-[65vh] min-h-[450px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2 sm:flex-1">
          <TrendingUp size={20} className="text-primary" />
          {labels.trends}
        </h3>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl mx-auto sm:mx-0">
          <button
            onClick={() => onChangeMonth(-1)}
            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all text-gray-500 dark:text-gray-300"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <span className="text-xs font-bold w-24 text-center text-gray-900 dark:text-white">
            {chartDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
          </span>
          <button
            onClick={() => onChangeMonth(1)}
            disabled={!canMoveToNextMonth(chartDate)}
            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all text-gray-500 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke={isDark ? '#6b7280' : '#9ca3af'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              fontWeight={500}
            />
            <YAxis
              stroke={isDark ? '#6b7280' : '#9ca3af'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontWeight={500}
            />
            <Tooltip
              cursor={{ stroke: isDark ? '#374151' : '#e5e7eb', strokeWidth: 2 }}
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                borderColor: isDark ? '#374151' : '#fff',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px',
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
              labelStyle={{
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: '8px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            />
            <Line type="natural" dataKey="elec" name={labels.electricity} stroke="#eab308" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} strokeDasharray={3} />
            <Line type="natural" dataKey="cold" name={labels.coldWater} stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
            <Line type="natural" dataKey="hot" name={labels.hotWater} stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
            <Legend content={<CustomLegend estimatedToday={labels.estimatedToday} />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <BrainCircuit size={20} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white">{labels.trendAnalysisTitle}</h4>
        </div>
        {!trendAnalysis && (
          <button
            onClick={onGenerateAnalysis}
            disabled={isTrendAiLoading || !enableAI}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isTrendAiLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
            {enableAI ? labels.generateAnalysis : labels.analysisNotEnabled}
          </button>
        )}
      </div>

      {trendAnalysis ? (
        <div className="animate-fade-in bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl">
          <MarkdownText content={trendAnalysis} className="text-gray-600 dark:text-gray-300" />
          <button onClick={onResetAnalysis} className="mt-3 text-xs text-gray-400 underline font-medium">
            {labels.regenerate}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 pl-1">{labels.analysisPlaceholder}</p>
      )}
    </div>
  </div>
);
