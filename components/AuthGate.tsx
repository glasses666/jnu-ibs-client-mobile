import type { FormEvent } from 'react';

import { AuthLoadingScreen } from './AuthLoadingScreen.js';
import { CloudAuth } from './CloudAuth.js';
import { LoginScreen } from './LoginScreen.js';
import { RoomBinding } from './RoomBinding.js';

type AuthGateLabels = {
  login: string;
  title: string;
  roomPlaceholder: string;
  loading: string;
  tryDemo: string;
};

type AuthGateProps = {
  labels: AuthGateLabels;
  apiBaseUrl: string;
  isDark: boolean;
  isLoading: boolean;
  isAutoLoggingIn: boolean;
  isCloudAuthEnabled: boolean;
  canUseCloudAuth: boolean;
  isLoggedIn: boolean;
  showBinding: boolean;
  showCloudAuth: boolean;
  userName: string;
  currentUserId: string;
  loginRoom: string;
  errorMsg: string;
  customApiUrl: string;
  showServerConfig: boolean;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onShowCloudAuth: () => void;
  onShowServerConfig: () => void;
  onHideServerConfig: () => void;
  onCustomApiUrlChange: (value: string) => void;
  onLoginRoomChange: (value: string) => void;
  onLogin: (event?: FormEvent) => void;
  onEnterDemoMode: () => void;
  onBindingSuccess: (roomId: string, nickname: string) => void;
  onCloudAuthSuccess: (user: any) => void;
};

export const AuthGate = ({
  labels,
  apiBaseUrl,
  isDark,
  isLoading,
  isAutoLoggingIn,
  isCloudAuthEnabled,
  canUseCloudAuth,
  isLoggedIn,
  showBinding,
  showCloudAuth,
  userName,
  currentUserId,
  loginRoom,
  errorMsg,
  customApiUrl,
  showServerConfig,
  onToggleLang,
  onToggleTheme,
  onShowCloudAuth,
  onShowServerConfig,
  onHideServerConfig,
  onCustomApiUrlChange,
  onLoginRoomChange,
  onLogin,
  onEnterDemoMode,
  onBindingSuccess,
  onCloudAuthSuccess,
}: AuthGateProps) => {
  if (isLoggedIn) {
    return null;
  }

  if (isAutoLoggingIn) {
    return <AuthLoadingScreen userName={userName} />;
  }

  if (showBinding) {
    return <RoomBinding userId={currentUserId} onBindSuccess={onBindingSuccess} />;
  }

  if (showCloudAuth && isCloudAuthEnabled && canUseCloudAuth) {
    return (
      <CloudAuth
        onLoginSuccess={onCloudAuthSuccess}
        onAdminLogin={() => {
          alert('管理员通道已激活');
        }}
      />
    );
  }

  return (
    <LoginScreen
      labels={labels}
      apiBaseUrl={apiBaseUrl}
      isCloudAuthEnabled={isCloudAuthEnabled}
      isDark={isDark}
      isLoading={isLoading}
      loginRoom={loginRoom}
      errorMsg={errorMsg}
      customApiUrl={customApiUrl}
      showServerConfig={showServerConfig}
      onToggleLang={onToggleLang}
      onToggleTheme={onToggleTheme}
      onShowCloudAuth={onShowCloudAuth}
      onShowServerConfig={onShowServerConfig}
      onHideServerConfig={onHideServerConfig}
      onCustomApiUrlChange={onCustomApiUrlChange}
      onLoginRoomChange={onLoginRoomChange}
      onLogin={onLogin}
      onEnterDemoMode={onEnterDemoMode}
    />
  );
};
