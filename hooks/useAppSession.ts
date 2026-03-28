import { useEffect, useState, type FormEvent } from 'react';

import { aiService } from '../services/geminiService';
import { ibsService } from '../services/ibsService';
import { supabase } from '../services/supabaseClient';
import { weatherService } from '../services/weatherService';
import type { AIProvider, Language } from '../types';
import {
  createDemoSessionData,
  createInitialSessionState,
  getShiftedMonth,
  resolveCloudAuthNextStep,
  type SessionState,
} from '../utils/appSession';

type SessionLabels = {
  loginFail: string;
  networkError: string;
};

type SessionAiConfig = {
  isConfigLoaded: boolean;
  enableAI: boolean;
  apiKey: string;
  aiBaseUrl: string;
  aiProvider: AIProvider;
  aiModel: string;
};

type UseAppSessionArgs = {
  labels: SessionLabels;
  lang: Language;
  ai: SessionAiConfig;
};

export const useAppSession = ({ labels, lang, ai }: UseAppSessionArgs) => {
  const [session, setSession] = useState<SessionState>(() => createInitialSessionState());
  const [isTrendAiLoading, setIsTrendAiLoading] = useState(false);

  const patchSession = (patch: Partial<SessionState>) => {
    setSession((current) => ({ ...current, ...patch }));
  };

  const loadData = async () => {
    patchSession({ isLoading: true });

    try {
      const [overview, records, trends, weather] = await Promise.all([
        ibsService.fetchOverview(),
        ibsService.fetchRecords(1, 20),
        ibsService.fetchTrends(session.chartDate.getFullYear(), session.chartDate.getMonth()),
        weatherService.getWeather(),
      ]);

      patchSession({
        overview,
        records,
        trends,
        weather,
        errorMsg: '',
      });
    } catch (error) {
      console.error(error);
      patchSession({ errorMsg: labels.networkError });
    } finally {
      patchSession({ isLoading: false });
    }
  };

  const refreshTrendsOnly = async () => {
    if (session.isDemo) {
      return;
    }

    try {
      const trends = await ibsService.fetchTrends(
        session.chartDate.getFullYear(),
        session.chartDate.getMonth()
      );
      patchSession({ trends });
    } catch (error) {
      console.error('Failed to refresh trends', error);
    }
  };

  const enterDemoMode = () => {
    patchSession({ isLoading: true });

    setTimeout(() => {
      patchSession(createDemoSessionData(session.chartDate));
    }, 800);
  };

  const handleLogin = async (event?: FormEvent, roomOverride?: string) => {
    event?.preventDefault();

    const roomToUse = roomOverride || session.loginRoom;

    if (!roomToUse) {
      return;
    }

    if (roomToUse.toUpperCase() === 'DEMO') {
      enterDemoMode();
      return;
    }

    patchSession({ isLoading: true, errorMsg: '' });

    try {
      await ibsService.login(roomToUse);

      patchSession({
        isLoggedIn: true,
        isDemo: false,
        loginRoom: roomOverride || session.loginRoom,
      });

      await loadData();
    } catch (error: any) {
      patchSession({
        errorMsg: `${labels.loginFail}: ${error.message || 'Unknown'}`,
        isAutoLoggingIn: false,
      });
    } finally {
      patchSession({
        isLoading: false,
        isAutoLoggingIn: false,
      });
    }
  };

  const handleRefresh = () => {
    if (session.isDemo) {
      patchSession({ isLoading: true });
      setTimeout(() => patchSession({ isLoading: false }), 500);
      return;
    }

    void loadData();
  };

  const handleTrendAnalysis = async () => {
    if (!ai.enableAI || !ai.apiKey) {
      patchSession({ activeTab: 'settings' });
      return;
    }

    setIsTrendAiLoading(true);

    try {
      aiService.initialize(ai.apiKey, ai.aiBaseUrl, ai.aiProvider, ai.aiModel);
      const trendAnalysis = await aiService.generateTrendAnalysis(session.trends, lang);
      patchSession({ trendAnalysis });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTrendAiLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    ibsService.logout();
    setSession(createInitialSessionState());
    setIsTrendAiLoading(false);
  };

  const handleBindingSuccess = (roomId: string, nickname: string) => {
    patchSession({
      showBinding: false,
      userName: nickname,
      isAutoLoggingIn: true,
    });

    void handleLogin(undefined, roomId);
  };

  const handleCloudAuthSuccess = async (user: any) => {
    if (!supabase) {
      patchSession({ showCloudAuth: false });
      return;
    }

    const { data } = await supabase
      .from('user_bindings')
      .select('room_id, nickname')
      .eq('user_id', user.id)
      .single();

    patchSession({ showCloudAuth: false });

    const nextStep = resolveCloudAuthNextStep({
      roomId: data?.room_id,
      nickname: data?.nickname,
      email: user.email,
      userId: user.id,
    });

    if (nextStep.type === 'auto-login') {
      patchSession({
        userName: nextStep.userName,
        isAutoLoggingIn: true,
      });
      void handleLogin(undefined, nextStep.roomId);
      return;
    }

    patchSession({
      currentUserId: nextStep.userId,
      showBinding: true,
    });
  };

  useEffect(() => {
    if (session.isLoggedIn && !session.isDemo) {
      void refreshTrendsOnly();
    } else if (session.isDemo) {
      patchSession({ trends: createDemoSessionData(session.chartDate).trends });
    }
  }, [session.chartDate]);

  useEffect(() => {
    if (ai.isConfigLoaded && session.overview && ai.enableAI && ai.apiKey && !session.dailyBrief) {
      aiService.initialize(ai.apiKey, ai.aiBaseUrl, ai.aiProvider, ai.aiModel);
      aiService
        .generateDailyBrief(session.overview, lang, session.weather)
        .then((dailyBrief) => patchSession({ dailyBrief }))
        .catch((error) => console.warn('Daily Brief Failed:', error));
    }
  }, [
    ai.aiBaseUrl,
    ai.aiModel,
    ai.aiProvider,
    ai.apiKey,
    ai.enableAI,
    ai.isConfigLoaded,
    lang,
    session.dailyBrief,
    session.overview,
    session.weather,
  ]);

  return {
    session,
    isTrendAiLoading,
    setLoginRoom: (loginRoom: string) => patchSession({ loginRoom }),
    setActiveTab: (activeTab: SessionState['activeTab']) => patchSession({ activeTab }),
    setShowCloudAuth: (showCloudAuth: boolean) => patchSession({ showCloudAuth }),
    setTrendAnalysis: (trendAnalysis: string) => patchSession({ trendAnalysis }),
    changeMonth: (offset: number) => patchSession({ chartDate: getShiftedMonth(session.chartDate, offset) }),
    enterDemoMode,
    handleLogin,
    handleRefresh,
    handleTrendAnalysis,
    handleLogout,
    handleBindingSuccess,
    handleCloudAuthSuccess,
  };
};
