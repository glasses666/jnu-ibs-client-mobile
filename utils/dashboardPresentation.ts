import type { MetricalDataResult, OverviewData } from '../types';

type Currency = 'CNY' | 'USD';

type BalanceStatusLabels = {
  statusActive: string;
  statusRecommend: string;
  statusOffline: string;
};

type TrendChartOptions = {
  trends: MetricalDataResult[];
  chartDate: Date;
  lang: 'zh' | 'en';
  estimatedTodayLabel: string;
  today?: Date;
};

export type TrendChartDatum = {
  name: string;
  rawDate?: number;
  elec?: number;
  cold?: number;
  hot?: number;
  isEstimate?: boolean;
};

const getEstimatedLabelSuffix = (label: string) => {
  const match = label.match(/\(([^)]+)\)\s*$/);

  if (match?.[1]) {
    return match[1].trim();
  }

  return label.trim();
};

export const formatMoney = (amountInCNY: number, currency: Currency) => {
  if (currency === 'CNY') {
    return `¥${amountInCNY.toFixed(2)}`;
  }

  return `$${(amountInCNY * 0.138).toFixed(2)}`;
};

export const getBalanceStatus = (balance: number, labels: BalanceStatusLabels) => {
  if (balance <= 0) {
    return {
      textClass: 'text-red-400',
      statusText: labels.statusOffline,
      dotClass: 'bg-red-500 shadow-[0_0_8px_rgb(239,68,68)] animate-pulse-fast',
    };
  }

  if (balance <= 30) {
    return {
      textClass: 'text-yellow-400',
      statusText: labels.statusRecommend,
      dotClass: 'bg-yellow-400 shadow-[0_0_8px_rgb(250,204,21)] animate-pulse-slow',
    };
  }

  return {
    textClass: 'text-white',
    statusText: labels.statusActive,
    dotClass: 'bg-green-400 shadow-[0_0_8px_rgb(74,222,128)]',
  };
};

export const getTotalSubsidyMoney = (subsidyMoney?: OverviewData['subsidyMoney']) => {
  if (!subsidyMoney) {
    return 0;
  }

  return parseFloat(
    ((subsidyMoney.elec || 0) + (subsidyMoney.cold || 0) + (subsidyMoney.hot || 0)).toFixed(2)
  );
};

export const prepareTrendChartData = ({
  trends,
  chartDate,
  lang,
  estimatedTodayLabel,
  today = new Date(),
}: TrendChartOptions) => {
  const dateMap: Record<string, TrendChartDatum> = {};
  let lastDateObj: Date | null = null;

  trends.forEach((group) => {
    const typeId = Number(group.energyType);

    group.datas.forEach((point) => {
      const dateObj = new Date(point.recordTime);
      if (!lastDateObj || dateObj > lastDateObj) {
        lastDateObj = dateObj;
      }

      const dateLabel = dateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'numeric',
        day: 'numeric',
      });

      if (!dateMap[dateLabel]) {
        dateMap[dateLabel] = { name: dateLabel, rawDate: dateObj.getTime() };
      }

      if (typeId === 2) {
        dateMap[dateLabel].elec = point.dataValue;
      } else if (typeId === 3) {
        dateMap[dateLabel].cold = point.dataValue;
      } else if (typeId === 4) {
        dateMap[dateLabel].hot = point.dataValue;
      }
    });
  });

  const data = Object.values(dateMap).sort((left, right) => (left.rawDate || 0) - (right.rawDate || 0));
  const isCurrentMonth = chartDate.getMonth() === today.getMonth() && chartDate.getFullYear() === today.getFullYear();

  if (!isCurrentMonth || !lastDateObj || lastDateObj.getDate() >= today.getDate()) {
    return data;
  }

  const getLast3Avg = (key: 'elec' | 'cold' | 'hot') => {
    const recent = data
      .slice(-3)
      .map((entry) => entry[key] || 0)
      .filter((value) => value > 0);

    if (recent.length === 0) {
      return 0;
    }

    const sum = recent.reduce((accumulator, value) => accumulator + value, 0);
    return parseFloat((sum / recent.length).toFixed(2));
  };

  data.push({
    name: `${today.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
    })} (${getEstimatedLabelSuffix(estimatedTodayLabel)})`,
    elec: getLast3Avg('elec'),
    cold: getLast3Avg('cold'),
    hot: getLast3Avg('hot'),
    isEstimate: true,
  });

  return data;
};
