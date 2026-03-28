import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AuthGate } from '../components/AuthGate.js';

const labels = {
  login: '登录',
  title: '暨南大学 IBS 水电查询',
  roomPlaceholder: '房间号 (如 T8201)',
  loading: '加载中...',
  tryDemo: '试用演示模式',
};

test('AuthGate renders the auto-login welcome screen first', () => {
  const html = renderToStaticMarkup(
    <AuthGate
      labels={labels}
      apiBaseUrl="https://example.com/"
      isDark={false}
      isLoading={false}
      isAutoLoggingIn={true}
      isCloudAuthEnabled={true}
      canUseCloudAuth={true}
      isLoggedIn={false}
      showBinding={false}
      showCloudAuth={false}
      userName="Draco"
      currentUserId=""
      loginRoom=""
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

  assert.match(html, /Draco/);
  assert.match(html, /欢迎回家/);
});

test('AuthGate renders room binding when the cloud user still needs a room', () => {
  const html = renderToStaticMarkup(
    <AuthGate
      labels={labels}
      apiBaseUrl="https://example.com/"
      isDark={false}
      isLoading={false}
      isAutoLoggingIn={false}
      isCloudAuthEnabled={true}
      canUseCloudAuth={true}
      isLoggedIn={false}
      showBinding={true}
      showCloudAuth={false}
      userName=""
      currentUserId="user-1"
      loginRoom=""
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

  assert.match(html, /绑定宿舍/);
  assert.match(html, /确认绑定/);
});

test('AuthGate renders cloud auth before the plain login screen when enabled', () => {
  const html = renderToStaticMarkup(
    <AuthGate
      labels={labels}
      apiBaseUrl="https://example.com/"
      isDark={true}
      isLoading={false}
      isAutoLoggingIn={false}
      isCloudAuthEnabled={true}
      canUseCloudAuth={true}
      isLoggedIn={false}
      showBinding={false}
      showCloudAuth={true}
      userName=""
      currentUserId=""
      loginRoom=""
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

  assert.match(html, /欢迎回来/);
  assert.doesNotMatch(html, /暨南大学 IBS 水电查询/);
});
