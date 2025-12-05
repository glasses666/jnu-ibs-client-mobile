import { CapacitorHttp } from '@capacitor/core';
import { WEATHER_API_ID, WEATHER_API_KEY } from '../constants';

export interface WeatherData {
  temperature: number;
  weather: string;
  place: string;
  wind: string;
  humidity: number;
  code: number;
  msg?: string;
}

export class WeatherService {
  async getWeather(ip?: string): Promise<WeatherData | null> {
    try {
        // APIHZ requires GET parameters
        const query = `id=${WEATHER_API_ID}&key=${WEATHER_API_KEY}${ip ? `&ip=${ip}` : ''}`;
        const url = `https://cn.apihz.cn/api/tianqi/tqybip.php?${query}`;

        const response = await CapacitorHttp.get({ url });

        if (response.status === 200 && response.data) {
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            
            if (data.code === 200) {
                return {
                    temperature: parseFloat(data.temperature),
                    weather: data.weather2 && data.weather2 !== data.weather1 
                        ? `${data.weather1}转${data.weather2}` 
                        : data.weather1,
                    place: data.place,
                    wind: `${data.windDirection} ${data.windScale}`,
                    humidity: parseInt(data.humidity),
                    code: 200
                };
            } else {
                console.warn("Weather API Error:", data.msg);
            }
        }
        return null;
    } catch (e) {
        console.error("Weather Network Error:", e);
        return null;
    }
  }
}

export const weatherService = new WeatherService();
