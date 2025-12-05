
export interface RoomInfo {
  keyName: string;
  keyValue: string;
}

export interface UserInfoResult {
  roomInfo: RoomInfo[];
  customerId: string;
}

export interface SubsidyItem {
  itemType: number;
  totalValue: number;
  avalibleValue: number;
}

export interface BillItemValue {
  energyValue: number;
}

export interface EnergyCostDetail {
  billItemValues: BillItemValue[];
}

export interface BillItem {
  energyType: number;
  unitPrice: number;
  energyCostDetails: EnergyCostDetail[];
}

export interface PaymentRecord {
  logTime: number; // Unix timestamp ms
  paymentType: string;
  itemType: number;
  dataValue: number;
}

export interface DailyDataPoint {
  recordTime: number;
  dataValue: number;
}

export interface MetricalDataResult {
  energyType: number;
  datas: DailyDataPoint[];
}

export interface OverviewData {
  room: string;
  balance: number;
  costs: {
    elec: number;
    cold: number;
    hot: number;
    total: number;
  };
  subsidy: {
    elec: number;
    cold: number;
    hot: number;
  };
  details: {
    elec: [number, number]; // [usage, price]
    cold: [number, number];
    hot: [number, number];
  };
}

export interface JNUResponse<T> {
  d: {
    Success?: boolean;
    Msg?: string;
    ResultList?: T[];
    TotalCounts?: number;
  };
}

export enum Language {
  ZH = 'zh',
  EN = 'en'
}

export type AIProvider = 'google' | 'openai';

export interface AppConfig {
  apiKey: string;
  aiProvider: AIProvider;
  aiModel: string;
  aiBaseUrl?: string;
  isDark: boolean;
  language: Language;
}

export enum EnergyType {
  ALL = 0,
  ELEC = 2,
  COLD_WATER = 3,
  HOT_WATER = 4
}
