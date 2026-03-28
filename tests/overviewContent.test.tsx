import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OverviewContent } from '../components/OverviewContent.js';

const labels = {
  balance: '账户余额',
  totalCost: '总支出',
  subsidyLabel: '补贴',
  showMoney: '显示金额',
  showUnit: '显示用量',
  electricity: '电费',
  coldWater: '冷水',
  hotWater: '热水',
  unitKwh: 'kWh',
  unitM3: 'm³',
};

const overview = {
  room: 'T8201',
  balance: 124.5,
  costs: { elec: 85.2, cold: 24.5, hot: 12, total: 121.7 },
  subsidy: { elec: 15.5, cold: 5, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.1, hot: 0 },
  details: {
    elec: [131.6, 0.647] as [number, number],
    cold: [8.7, 2.82] as [number, number],
    hot: [0.48, 25] as [number, number],
  },
};

test('OverviewContent renders a skeleton state when overview data is missing', () => {
  const html = renderToStaticMarkup(
    <OverviewContent
      labels={labels}
      overview={null}
      dailyBrief=""
      displayUnit="money"
      totalSubsidyMoney={0}
      balanceStatus={{
        textClass: 'text-white',
        statusText: '服务正常',
        dotClass: 'bg-green-400',
      }}
      formatMoney={() => '¥0.00'}
      onSetDisplayUnit={() => {}}
      onOpenCalculator={() => {}}
      onRefresh={() => {}}
    />
  );

  assert.match(html, /animate-pulse/);
  assert.doesNotMatch(html, /智能充值助手/);
});

test('OverviewContent renders the daily brief and utility cards when data exists', () => {
  const html = renderToStaticMarkup(
    <OverviewContent
      labels={labels}
      overview={overview}
      dailyBrief="今天记得省电。"
      displayUnit="money"
      totalSubsidyMoney={24.13}
      balanceStatus={{
        textClass: 'text-white',
        statusText: '服务正常',
        dotClass: 'bg-green-400',
      }}
      formatMoney={(value) => `¥${value.toFixed(2)}`}
      onSetDisplayUnit={() => {}}
      onOpenCalculator={() => {}}
      onRefresh={() => {}}
    />
  );

  assert.match(html, /今天记得省电/);
  assert.match(html, /电费/);
  assert.match(html, /冷水/);
  assert.match(html, /热水/);
});
