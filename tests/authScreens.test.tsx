import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AuthLoadingScreen } from '../components/AuthLoadingScreen.js';
import { LoginScreen } from '../components/LoginScreen.js';

const labels = {
  login: '登录',
  title: '暨南大学 IBS 水电查询',
  roomPlaceholder: '房间号 (如 T8201)',
  loading: '加载中...',
  tryDemo: '试用演示模式',
};

test('AuthLoadingScreen falls back to "User" when nickname is missing', () => {
  const html = renderToStaticMarkup(<AuthLoadingScreen userName="" />);

  assert.match(html, /User/);
  assert.match(html, /欢迎回家/);
});

test('LoginScreen hides the cloud login entry when cloud auth is disabled', () => {
  const html = renderToStaticMarkup(
    <LoginScreen
      labels={labels}
      apiBaseUrl="https://pynhcx.jnu.edu.cn/IBSjnuweb/WebService/JNUService.asmx/"
      isCloudAuthEnabled={false}
      isDark={false}
      isLoading={false}
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
      onLogin={(_event) => {}}
      onEnterDemoMode={() => {}}
    />
  );

  assert.doesNotMatch(html, /Cloud login/);
});

test('LoginScreen renders the server configuration modal when requested', () => {
  const html = renderToStaticMarkup(
    <LoginScreen
      labels={labels}
      apiBaseUrl="https://pynhcx.jnu.edu.cn/IBSjnuweb/WebService/JNUService.asmx/"
      isCloudAuthEnabled={true}
      isDark={true}
      isLoading={false}
      loginRoom="T8201"
      errorMsg=""
      customApiUrl="https://example.com"
      showServerConfig={true}
      onToggleLang={() => {}}
      onToggleTheme={() => {}}
      onShowCloudAuth={() => {}}
      onShowServerConfig={() => {}}
      onHideServerConfig={() => {}}
      onCustomApiUrlChange={() => {}}
      onLoginRoomChange={() => {}}
      onLogin={(_event) => {}}
      onEnterDemoMode={() => {}}
    />
  );

  assert.match(html, /Server Settings/);
  assert.match(html, /https:\/\/example\.com/);
});
