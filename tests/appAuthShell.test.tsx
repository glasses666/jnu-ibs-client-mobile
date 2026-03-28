import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppAuthShell } from '../components/AppAuthShell.js';

const labels = {
  login: '登录',
  title: '暨南大学 IBS 水电查询',
  roomPlaceholder: '房间号 (如 T8201)',
  loading: '加载中...',
  tryDemo: '试用演示模式',
};

test('AppAuthShell renders the login flow when the user is signed out', () => {
  const html = renderToStaticMarkup(
    <AppAuthShell
      labels={labels}
      apiBaseUrl="https://example.com/"
      isDark={false}
      isLoading={false}
      isAutoLoggingIn={false}
      isCloudAuthEnabled={true}
      canUseCloudAuth={true}
      isLoggedIn={false}
      showBinding={false}
      showCloudAuth={false}
      userName=""
      currentUserId=""
      loginRoom="T8201"
      errorMsg=""
      customApiUrl=""
      showServerConfig={false}
      onToggleLang={() => {}}
      onToggleTheme={() => {}}
      onShowCloudAuth={() => {}}
      onShowServerConfig={() => {}}
      onHideServerConfig={() => {}}
      onCustomApiUrlChange={() => {}}
      onLoginRoomChange={() => {}}
      onLogin={() => {}}
      onEnterDemoMode={() => {}}
      onBindingSuccess={() => {}}
      onCloudAuthSuccess={() => {}}
    />
  );

  assert.match(html, /暨南大学 IBS 水电查询/);
  assert.match(html, /试用演示模式/);
  assert.match(html, /T8201/);
});
