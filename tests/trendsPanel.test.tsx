import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { TrendsPanel } from '../components/TrendsPanel.js';

const labels = {
  trends: '趋势',
  electricity: '电费',
  coldWater: '冷水',
  hotWater: '热水',
  estimatedToday: '今日 (预估)',
  trendAnalysisTitle: 'AI 趋势解读',
  generateAnalysis: '生成分析',
  analysisNotEnabled: '未启用 AI',
  analysisPlaceholder: '点击生成基于当前图表数据的智能分析报告。',
  regenerate: '重新生成',
};

const chartData = [
  { name: '3/27', elec: 6.5, cold: 0.8, hot: 0.2 },
  { name: '3/28 (预估)', elec: 6.7, cold: 0.7, hot: 0.2, isEstimate: true },
];

const renderPanel = (trendAnalysis: string, enableAI: boolean, isDark = false) => {
  const originalWarn = console.warn;

  console.warn = () => {};

  try {
    return renderToStaticMarkup(
      <TrendsPanel
        labels={labels}
        chartDate={new Date('2026-03-01T00:00:00Z')}
        chartData={chartData}
        isDark={isDark}
        enableAI={enableAI}
        trendAnalysis={trendAnalysis}
        isTrendAiLoading={false}
        onChangeMonth={() => {}}
        onGenerateAnalysis={() => {}}
        onResetAnalysis={() => {}}
      />
    );
  } finally {
    console.warn = originalWarn;
  }
};

test('TrendsPanel shows the disabled AI call to action when analysis is unavailable', () => {
  const html = renderPanel('', false);

  assert.match(html, /未启用 AI/);
  assert.match(html, /点击生成基于当前图表数据的智能分析报告/);
  assert.match(html, /趋势/);
});

test('TrendsPanel renders existing analysis content and the regenerate action', () => {
  const html = renderPanel('**走势稳定**，暂时不需要加大充值频率。', true, true);

  assert.match(html, /走势稳定/);
  assert.match(html, /重新生成/);
  assert.match(html, /AI 趋势解读/);
});
