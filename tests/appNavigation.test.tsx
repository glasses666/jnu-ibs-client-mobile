import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  DesktopSidebar,
  MobileBottomNav,
  MobileHeader,
} from '../components/AppNavigation.js';

const labels = {
  dashboard: '概览',
  trends: '趋势',
  records: '记录',
  settings: '设置',
  logout: '退出登录',
};

test('DesktopSidebar renders room metadata and navigation labels', () => {
  const html = renderToStaticMarkup(
    <DesktopSidebar
      labels={labels}
      room="T8201"
      activeTab="records"
      onSetActiveTab={() => {}}
      onLogout={() => {}}
    />
  );

  assert.match(html, /IBS Client/);
  assert.match(html, /T8201/);
  assert.match(html, /退出登录/);
});

test('MobileHeader renders room and weather information', () => {
  const html = renderToStaticMarkup(
    <MobileHeader
      room="T8201"
      weather={{
        place: 'Guangzhou',
        weather: 'Sunny',
        temperature: 28,
        wind: 'East 2',
        humidity: 61,
        code: 200,
      }}
      isLoading={true}
      onRefresh={() => {}}
    />
  );

  assert.match(html, /T8201/);
  assert.match(html, /Sunny 28°/);
  assert.match(html, /animate-spin/);
});

test('MobileBottomNav uses the iOS glass class when the platform is ios', () => {
  const html = renderToStaticMarkup(
    <MobileBottomNav
      activeTab="settings"
      onSetActiveTab={() => {}}
      platform="ios"
    />
  );

  assert.match(html, /ios-liquid-glass/);
});
