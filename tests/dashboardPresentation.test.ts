import test from 'node:test';
import assert from 'node:assert/strict';

import { EnergyType, Language } from '../types.js';
import {
  formatMoney,
  getBalanceStatus,
  getTotalSubsidyMoney,
  prepareTrendChartData,
} from '../utils/dashboardPresentation.js';

const statusLabels = {
  statusActive: '服务正常',
  statusRecommend: '建议充值',
  statusOffline: '已欠费',
  estimatedToday: '今日 (预估)',
};

test('formatMoney renders CNY values with a yuan prefix', () => {
  assert.equal(formatMoney(12.345, 'CNY'), '¥12.35');
});

test('formatMoney converts USD using the existing exchange ratio', () => {
  assert.equal(formatMoney(10, 'USD'), '$1.38');
});

test('getBalanceStatus returns the offline state for non-positive balances', () => {
  assert.deepEqual(getBalanceStatus(0, statusLabels), {
    textClass: 'text-red-400',
    statusText: '已欠费',
    dotClass: 'bg-red-500 shadow-[0_0_8px_rgb(239,68,68)] animate-pulse-fast',
  });
});

test('getTotalSubsidyMoney sums subsidy buckets and rounds to cents', () => {
  assert.equal(
    getTotalSubsidyMoney({
      elec: 10.005,
      cold: 14.1,
      hot: 0,
    }),
    24.11
  );
});

test('prepareTrendChartData appends an estimate point for the current month when today is missing', () => {
  const chartData = prepareTrendChartData({
    trends: [
      {
        energyType: EnergyType.ELEC,
        datas: [
          { recordTime: new Date('2026-03-25T00:00:00Z').getTime(), dataValue: 5 },
          { recordTime: new Date('2026-03-26T00:00:00Z').getTime(), dataValue: 7 },
          { recordTime: new Date('2026-03-27T00:00:00Z').getTime(), dataValue: 8 },
        ],
      },
    ],
    chartDate: new Date('2026-03-01T00:00:00Z'),
    lang: Language.ZH,
    today: new Date('2026-03-28T00:00:00Z'),
    estimatedTodayLabel: statusLabels.estimatedToday,
  });

  const lastPoint = chartData.at(-1);

  assert.equal(lastPoint?.isEstimate, true);
  assert.equal(lastPoint?.elec, 6.67);
  assert.match(lastPoint?.name ?? '', /预估/);
});

test('prepareTrendChartData derives the estimate suffix from a localized legend label', () => {
  const chartData = prepareTrendChartData({
    trends: [
      {
        energyType: EnergyType.ELEC,
        datas: [
          { recordTime: new Date('2026-03-25T00:00:00Z').getTime(), dataValue: 5 },
        ],
      },
    ],
    chartDate: new Date('2026-03-01T00:00:00Z'),
    lang: Language.EN,
    today: new Date('2026-03-28T00:00:00Z'),
    estimatedTodayLabel: 'Today (Est.)',
  });

  assert.match(chartData.at(-1)?.name ?? '', /\(Est\.\)$/);
});
