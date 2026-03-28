import type { WeatherData } from '../services/weatherService.js';
import {
  EnergyType,
  type ActiveTab,
  type MetricalDataResult,
  type OverviewData,
  type PaymentRecord,
} from '../types.js';

export type SessionState = {
  isLoggedIn: boolean;
  isDemo: boolean;
  loginRoom: string;
  isLoading: boolean;
  errorMsg: string;
  activeTab: ActiveTab;
  overview: OverviewData | null;
  records: PaymentRecord[];
  trends: MetricalDataResult[];
  weather: WeatherData | null;
  chartDate: Date;
  dailyBrief: string;
  trendAnalysis: string;
  showCloudAuth: boolean;
  showBinding: boolean;
  currentUserId: string;
  isAutoLoggingIn: boolean;
  userName: string;
};

type CloudAuthNextStepArgs = {
  roomId?: string | null;
  nickname?: string | null;
  email?: string | null;
  userId: string;
};

export const DEMO_DAILY_BRIEF = '☀️ 早安！又是元气满满的一天，记得节约用电哦~';

export const MOCK_OVERVIEW: OverviewData = {
  room: 'T8201',
  balance: 124.5,
  costs: { elec: 85.2, cold: 24.5, hot: 12, total: 121.7 },
  subsidy: { elec: 15.5, cold: 5, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.1, hot: 0 },
  details: { elec: [131.6, 0.647], cold: [8.7, 2.82], hot: [0.48, 25] },
};

export const MOCK_RECORDS: PaymentRecord[] = Array.from({ length: 15 }).map((_, index) => ({
  logTime: Date.now() - index * 86400000 * (Math.random() * 2 + 1),
  paymentType: index % 4 === 0 ? '微信充值' : '系统扣费',
  itemType: 2,
  dataValue: index % 4 === 0 ? 100 : -(Math.random() * 10 + 2),
}));

export const generateMockTrends = (date = new Date()): MetricalDataResult[] => {
  const today = new Date();
  const isCurrentMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const limitDay = isCurrentMonth ? Math.max(1, today.getDate() - 1) : daysInMonth;

  const generatePoints = (base: number, variance: number) =>
    Array.from({ length: limitDay }).map((_, index) => ({
      recordTime: new Date(date.getFullYear(), date.getMonth(), index + 1).getTime(),
      dataValue: parseFloat((base + Math.random() * variance).toFixed(2)),
    }));

  return [
    { energyType: EnergyType.ELEC, datas: generatePoints(5, 3) },
    { energyType: EnergyType.COLD_WATER, datas: generatePoints(0.5, 0.3) },
    { energyType: EnergyType.HOT_WATER, datas: generatePoints(0.1, 0.1) },
  ];
};

export const createInitialSessionState = (now = new Date()): SessionState => ({
  isLoggedIn: false,
  isDemo: false,
  loginRoom: '',
  isLoading: false,
  errorMsg: '',
  activeTab: 'overview',
  overview: null,
  records: [],
  trends: [],
  weather: null,
  chartDate: now,
  dailyBrief: '',
  trendAnalysis: '',
  showCloudAuth: false,
  showBinding: false,
  currentUserId: '',
  isAutoLoggingIn: false,
  userName: '',
});

export const createDemoSessionData = (chartDate = new Date()) => ({
  isDemo: true,
  isLoggedIn: true,
  isLoading: false,
  errorMsg: '',
  activeTab: 'overview' as ActiveTab,
  overview: MOCK_OVERVIEW,
  records: MOCK_RECORDS,
  trends: generateMockTrends(chartDate),
  dailyBrief: DEMO_DAILY_BRIEF,
});

export const resolveCloudAuthNextStep = ({
  roomId,
  nickname,
  email,
  userId,
}: CloudAuthNextStepArgs) => {
  if (roomId) {
    return {
      type: 'auto-login' as const,
      roomId,
      userName: nickname || email?.split('@')[0] || 'User',
    };
  }

  return {
    type: 'binding' as const,
    userId,
  };
};

export const getShiftedMonth = (chartDate: Date, offset: number) => {
  const nextDate = new Date(chartDate);
  nextDate.setMonth(nextDate.getMonth() + offset);
  return nextDate;
};
