import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { RechargeCalculatorModal } from '../components/RechargeCalculatorModal.js';

const labels = {
  calcTitle: '智能充值助手',
  calcDesc: '基于近期用量预测下次充值金额',
  balance: '账户余额',
  roommates: '宿舍人数',
  daysToCover: '预计使用天数',
  generatePlan: '计算充值方案',
  configureAi: '请在设置中配置 AI',
};

test('RechargeCalculatorModal renders nothing when closed', () => {
  const html = renderToStaticMarkup(
    <RechargeCalculatorModal
      isOpen={false}
      labels={labels}
      balance={0}
      formatMoney={() => '¥0.00'}
      roommates={4}
      daysToCover={30}
      canCalculate={false}
      isCalcLoading={false}
      calcResult=""
      onClose={() => {}}
      onRoommatesChange={() => {}}
      onDaysToCoverChange={() => {}}
      onCalculate={() => {}}
    />
  );

  assert.equal(html, '');
});

test('RechargeCalculatorModal shows the AI configuration hint when recharge planning is unavailable', () => {
  const html = renderToStaticMarkup(
    <RechargeCalculatorModal
      isOpen={true}
      labels={labels}
      balance={88}
      formatMoney={(value) => `¥${value.toFixed(2)}`}
      roommates={4}
      daysToCover={30}
      canCalculate={false}
      isCalcLoading={false}
      calcResult=""
      onClose={() => {}}
      onRoommatesChange={() => {}}
      onDaysToCoverChange={() => {}}
      onCalculate={() => {}}
    />
  );

  assert.match(html, /请在设置中配置 AI/);
  assert.match(html, /账户余额/);
  assert.match(html, /disabled/);
});

test('RechargeCalculatorModal renders the markdown result container when a calculation exists', () => {
  const html = renderToStaticMarkup(
    <RechargeCalculatorModal
      isOpen={true}
      labels={labels}
      balance={88}
      formatMoney={(value) => `¥${value.toFixed(2)}`}
      roommates={4}
      daysToCover={30}
      canCalculate={true}
      isCalcLoading={false}
      calcResult="**需充值总额**: ¥120"
      onClose={() => {}}
      onRoommatesChange={() => {}}
      onDaysToCoverChange={() => {}}
      onCalculate={() => {}}
    />
  );

  assert.match(html, /AI Plan/);
  assert.match(html, /需充值总额/);
});
