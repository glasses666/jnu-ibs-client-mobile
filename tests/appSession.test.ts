import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDemoSessionData,
  createInitialSessionState,
  getShiftedMonth,
  resolveCloudAuthNextStep,
} from '../utils/appSession.js';

test('createDemoSessionData seeds the demo overview, records, trends, and greeting', () => {
  const session = createDemoSessionData(new Date('2026-03-01T00:00:00Z'));

  assert.equal(session.isDemo, true);
  assert.equal(session.isLoggedIn, true);
  assert.equal(session.overview.room, 'T8201');
  assert.equal(session.records.length, 15);
  assert.equal(session.trends.length, 3);
  assert.match(session.dailyBrief, /早安/);
});

test('createInitialSessionState resets auth and data fields to the logged-out defaults', () => {
  const now = new Date('2026-03-28T08:00:00Z');
  const state = createInitialSessionState(now);

  assert.equal(state.isLoggedIn, false);
  assert.equal(state.activeTab, 'overview');
  assert.equal(state.loginRoom, '');
  assert.equal(state.overview, null);
  assert.deepEqual(state.records, []);
  assert.equal(state.chartDate.getTime(), now.getTime());
});

test('resolveCloudAuthNextStep auto-logins when a bound room exists', () => {
  assert.deepEqual(
    resolveCloudAuthNextStep({
      roomId: 'T8201',
      nickname: '',
      email: 'demo@example.com',
      userId: 'user-1',
    }),
    {
      type: 'auto-login',
      roomId: 'T8201',
      userName: 'demo',
    }
  );
});

test('resolveCloudAuthNextStep shows the binding step when no room exists', () => {
  assert.deepEqual(
    resolveCloudAuthNextStep({
      roomId: '',
      nickname: '',
      email: 'demo@example.com',
      userId: 'user-2',
    }),
    {
      type: 'binding',
      userId: 'user-2',
    }
  );
});

test('getShiftedMonth moves the chart date by whole calendar months', () => {
  const shifted = getShiftedMonth(new Date('2026-03-28T00:00:00Z'), -2);

  assert.equal(shifted.getMonth(), 0);
  assert.equal(shifted.getFullYear(), 2026);
});
