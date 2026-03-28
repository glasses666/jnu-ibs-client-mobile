import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { RecordsPanel } from '../components/RecordsPanel.js';

const labels = {
  rechargeRecords: '充值记录',
};

test('RecordsPanel shows the empty state when there are no transactions', () => {
  const html = renderToStaticMarkup(
    <RecordsPanel
      labels={labels}
      records={[]}
      formatMoney={() => '¥0.00'}
    />
  );

  assert.match(html, /No transaction history/);
});

test('RecordsPanel renders signed positive transaction amounts', () => {
  const html = renderToStaticMarkup(
    <RecordsPanel
      labels={labels}
      records={[
        {
          logTime: new Date('2026-03-28T12:00:00Z').getTime(),
          paymentType: '微信充值',
          itemType: 2,
          dataValue: 100,
        },
      ]}
      formatMoney={(value) => `¥${value.toFixed(2)}`}
    />
  );

  assert.match(html, /\+¥100\.00/);
  assert.match(html, /微信充值/);
});
