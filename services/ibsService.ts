import { API_BASE_URL, RATES } from '../constants';
import { encryptAndBase64 } from './cryptoUtils';
import { CapacitorHttp } from '@capacitor/core';
import { 
  JNUResponse, 
  OverviewData, 
  UserInfoResult, 
  SubsidyItem, 
  BillItem, 
  PaymentRecord, 
  MetricalDataResult,
  EnergyType
} from '../types';

const FALLBACK_URL = 'https://ibs1.glasser.top/IBSjnuweb/WebService/JNUService.asmx/';

export class IBSService {
  private userId: string | null = null;
  private room: string | null = null;
  private baseUrl: string = API_BASE_URL;
  private isCustomUrl: boolean = false; // Track if user manually set URL

  // New method to override Base URL
  setBaseUrl(url: string) {
    if (!url) {
        this.baseUrl = API_BASE_URL;
        this.isCustomUrl = false;
    } else {
        this.baseUrl = url.endsWith('/') ? url : `${url}/`;
        this.isCustomUrl = true;
    }
  }

  // ... (isLoggedIn, logout, getHeaders, login methods stay same) ...

  private async post<T>(endpoint: string, body: any = {}): Promise<JNUResponse<T>> {
    const makeRequest = async (url: string) => {
        const response = await CapacitorHttp.post({
          url: `${url}${endpoint}`,
          headers: this.getHeaders(),
          data: body,
          connectTimeout: 5000, // 5s timeout for faster failover
          readTimeout: 10000
        });
        
        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
        return response.data;
    };

    try {
        return await makeRequest(this.baseUrl);
    } catch (e: any) {
        // Only failover if:
        // 1. Not using a custom user-defined URL
        // 2. Current URL is the default primary URL
        // 3. Error implies network issue (not auth error)
        if (!this.isCustomUrl && this.baseUrl === API_BASE_URL) {
            console.warn("Primary connection failed, attempting fallback to Tunnel...");
            try {
                const res = await makeRequest(FALLBACK_URL);
                this.baseUrl = FALLBACK_URL; // Switch to fallback for session
                return res;
            } catch (fallbackError) {
                console.error("Fallback also failed");
                throw e; // Throw original error
            }
        }
        throw e;
    }
  }

  async fetchOverview(): Promise<OverviewData> {
    const [infoRes, allowanceRes, billRes] = await Promise.all([
      this.post<UserInfoResult>('GetUserInfo'),
      this.post<SubsidyItem>('GetSubsidy', { startDate: '2000-01-01', endDate: '2099-12-31' }),
      this.post<BillItem>('GetBillCost', { energyType: 0, startDate: '2000-01-01', endDate: '2099-12-31' })
    ]);

    return this.parseOverview(infoRes, allowanceRes, billRes);
  }

  async fetchRecords(page: number = 1, count: number = 20): Promise<PaymentRecord[]> {
    const payload = { startIdx: (page - 1) * count, recordCount: count };
    const res = await this.post<PaymentRecord>('GetPaymentRecord', payload);
    return res.d.ResultList || [];
  }

  async fetchTrends(year?: number, month?: number): Promise<MetricalDataResult[]> {
    const targetDate = new Date();
    if (year) targetDate.setFullYear(year);
    if (month !== undefined) targetDate.setMonth(month);

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const startDate = formatDate(firstDay);
    const today = new Date();
    let endDate = formatDate(lastDay);
    
    if (targetDate.getFullYear() === today.getFullYear() && targetDate.getMonth() === today.getMonth()) {
        endDate = formatDate(today);
    }

    const payload = {
      startDate,
      endDate,
      interval: 1, // Daily
      energyType: 0 // All
    };

    const res = await this.post<MetricalDataResult>('GetCustomerMetricalData', payload);
    return res.d.ResultList || [];
  }

  private parseOverview(
    infoRes: JNUResponse<UserInfoResult>,
    allowanceRes: JNUResponse<SubsidyItem>,
    billRes: JNUResponse<BillItem>
  ): OverviewData {
    const data: OverviewData = {
      room: this.room || 'Unknown',
      balance: 0.0,
      costs: { elec: 0, cold: 0, hot: 0, total: 0 },
      subsidy: { elec: 0, cold: 0, hot: 0 },
      subsidyMoney: { elec: 0, cold: 0, hot: 0 },
      details: { elec: [0, 0], cold: [0, 0], hot: [0, 0] }
    };

    try {
        if(infoRes.d.ResultList && infoRes.d.ResultList.length > 0) {
            const roomInfo = infoRes.d.ResultList[0].roomInfo;
             const balanceItem = roomInfo.find(i => i.keyName.includes('余额'));
             if (balanceItem) data.balance = parseFloat(parseFloat(balanceItem.keyValue).toFixed(2));
        }
    } catch (e) {
        console.warn("Error parsing balance", e);
    }

    const billList = billRes.d.ResultList || [];
    const subList = allowanceRes.d.ResultList || [];

    const getSubsidyData = (typeId: number) => {
        const item = subList.find(x => Number(x.itemType) === typeId);
        const val = item ? parseFloat(item.avalibleValue.toString() || '0') : 0;
        const rate = RATES[typeId] || 0;
        return {
            val: parseFloat(val.toFixed(2)),
            money: parseFloat((val * rate).toFixed(2))
        };
    };
    
    const subElec = getSubsidyData(EnergyType.ELEC);
    const subCold = getSubsidyData(EnergyType.COLD_WATER);
    const subHot = getSubsidyData(EnergyType.HOT_WATER);

    data.subsidy = {
        elec: subElec.val,
        cold: subCold.val,
        hot: subHot.val
    };
    data.subsidyMoney = {
        elec: subElec.money,
        cold: subCold.money,
        hot: subHot.money
    };

    const getDetails = (typeId: number): {cost: number, usage: number, price: number} => {
        let usage = 0.0;
        const billItem = billList.find(x => Number(x.energyType) === typeId);
        
        if (billItem && billItem.energyCostDetails && billItem.energyCostDetails.length > 0) {
            const vals = billItem.energyCostDetails[0].billItemValues;
            if (vals && vals.length > 0) {
                usage = parseFloat(vals[0].energyValue.toString() || '0');
            }
        }

        let price = billItem ? parseFloat(billItem.unitPrice.toString() || '0') : 0.0;
        if (price <= 0.001) {
            price = RATES[typeId] || 0.0;
        }

        const cost = usage * price;
        return { cost, usage, price };
    };

    const elec = getDetails(EnergyType.ELEC);
    const cold = getDetails(EnergyType.COLD_WATER);
    const hot = getDetails(EnergyType.HOT_WATER);

    data.costs = {
        elec: parseFloat(elec.cost.toFixed(2)),
        cold: parseFloat(cold.cost.toFixed(2)),
        hot: parseFloat(hot.cost.toFixed(2)),
        total: parseFloat((elec.cost + cold.cost + hot.cost).toFixed(2))
    };

    data.details = {
        elec: [elec.usage, elec.price],
        cold: [cold.usage, cold.price],
        hot: [hot.usage, hot.price]
    };

    return data;
  }
}

export const ibsService = new IBSService();
