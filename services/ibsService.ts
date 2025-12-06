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
  private isCustomUrl: boolean = false;

  // Set custom base URL
  setBaseUrl(url: string) {
    if (!url) {
        this.baseUrl = API_BASE_URL;
        this.isCustomUrl = false;
    } else {
        this.baseUrl = url.endsWith('/') ? url : `${url}/`;
        this.isCustomUrl = true;
    }
  }

  isLoggedIn(): boolean {
    return !!this.userId;
  }

  logout() {
    this.userId = null;
    this.room = null;
  }

  private getHeaders(): any {
    if (!this.userId) {
      throw new Error("Not logged in");
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tokenPayload = JSON.stringify({
      userID: this.userId,
      tokenTime: nowStr
    });

    const token = encryptAndBase64(tokenPayload);

    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IBSJnuClient/1.0',
      'Token': token,
      'DateTime': nowStr
    };
  }

  async login(room: string): Promise<boolean> {
    const cleanRoom = room.toUpperCase();
    const encryptedRoom = encryptAndBase64(cleanRoom);
    
    const payload = {
      user: cleanRoom,
      password: encryptedRoom
    };

    try {
      const response = await CapacitorHttp.post({
        url: `${this.baseUrl}Login`,
        headers: { 'Content-Type': 'application/json' },
        data: payload
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: JNUResponse<{ customerId: string }> = response.data;
      
      if (data.d.Success && data.d.ResultList && data.d.ResultList.length > 0) {
        this.userId = data.d.ResultList[0].customerId;
        this.room = cleanRoom;
        return true;
      } else {
        throw new Error(data.d.Msg || 'Login failed');
      }
    } catch (error) {
      // Simple failover for login if using default URL
      if (!this.isCustomUrl && this.baseUrl === API_BASE_URL) {
          console.warn("Login failed on primary, trying fallback...");
          try {
             const fbResponse = await CapacitorHttp.post({
                url: `${FALLBACK_URL}Login`,
                headers: { 'Content-Type': 'application/json' },
                data: payload
             });
             if (fbResponse.status === 200 && fbResponse.data.d?.Success) {
                 this.baseUrl = FALLBACK_URL;
                 this.userId = fbResponse.data.d.ResultList[0].customerId;
                 this.room = cleanRoom;
                 return true;
             }
          } catch (fbError) {
              console.error("Fallback login failed", fbError);
          }
      }
      console.error("Login Error:", error);
      throw error;
    }
  }

  private async post<T>(endpoint: string, body: any = {}): Promise<JNUResponse<T>> {
    const makeRequest = async (url: string) => {
        const response = await CapacitorHttp.post({
          url: `${url}${endpoint}`,
          headers: this.getHeaders(),
          data: body,
          connectTimeout: 5000, 
          readTimeout: 10000
        });
        
        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
        return response.data;
    };

    try {
        return await makeRequest(this.baseUrl);
    } catch (e: any) {
        if (!this.isCustomUrl && this.baseUrl === API_BASE_URL) {
            console.warn("Primary connection failed, attempting fallback to Tunnel...");
            try {
                const res = await makeRequest(FALLBACK_URL);
                this.baseUrl = FALLBACK_URL; 
                return res;
            } catch (fallbackError) {
                console.error("Fallback also failed");
                throw e; 
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
      interval: 1, 
      energyType: 0 
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