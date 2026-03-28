import type { WeatherData } from './weatherService.js';
import { OverviewData, MetricalDataResult, Language, AIProvider } from "../types.js";

export class AIService {
  private googleClient: any | null = null;
  private googleClientPromise: Promise<any> | null = null;
  private apiKey: string = '';
  private baseUrl: string = '';
  private provider: AIProvider = 'google';
  private modelName: string = 'gemini-2.5-flash';

  /**
   * Initialize the AI client configuration.
   */
  initialize(apiKey: string, baseUrl: string, provider: AIProvider, modelName: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl?.trim().replace(/\/$/, '') || ''; // Remove trailing slash
    this.provider = provider;
    this.modelName = modelName || (provider === 'google' ? 'gemini-2.5-flash' : 'gpt-3.5-turbo');
    this.googleClient = null;
    this.googleClientPromise = null;
  }

  async generateDailyBrief(overview: OverviewData, lang: Language, weather?: WeatherData | null): Promise<string> {
      if (!this.apiKey) return "";
      
      const hour = new Date().getHours();
      const timePeriod = hour < 9 ? "Early Morning" : hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
      const dateStr = new Date().toLocaleDateString();
      
      const weatherCtx = weather 
        ? `Weather: ${weather.weather}, ${weather.temperature}°C, ${weather.place}.` 
        : "Weather: Unknown.";

      // Calculate recent usage trend roughly
      // (This is a lightweight check, real trend data is better but overview has cost)
      const costStatus = overview.costs.elec > 150 ? "High elec usage" : "Normal usage";

      const prompt = lang === Language.ZH
        ? `Task: 写一句**极简短**的智能问候（不超过35字）。
           Context:
           - 时间: ${dateStr} ${hour}点 (${timePeriod})
           - 天气: ${weatherCtx} (请根据气温/季节给一句穿衣或出行建议)
           - 状态: 余额¥${overview.balance}, ${costStatus}
           
           Requirements:
           1. 必须包含合适的问候语（早/午/晚安）。
           2. 结合天气+用量/余额 给出温馨提示。
           3. 语气生动，使用 1-2 个 Emoji 🌤️。
           4. **绝对不要** 机械地报余额数字，而是说“余额充足”或“记得充值”。`
        : `Task: Write a short greeting (max 30 words).
           Context: Time ${hour}h, ${weatherCtx}, Balance ${overview.balance}.
           Req: Greeting based on time. Weather tip. Mention balance status (Safe/Low) without raw numbers. Emoji 🌤️.`;
        
      if (this.provider === 'google') {
          return this.callGoogleGemini(prompt);
      } else {
          return this.callOpenAICompatible("You are a helpful assistant.", prompt);
      }
  }

  async generateTrendAnalysis(trends: MetricalDataResult[], lang: Language): Promise<string> {
      if (!this.apiKey) throw new Error("No API Key");
      
      // Simplify trend data for AI to save tokens
      const simpleTrends = trends.map(t => ({
          type: t.energyType,
          last7Days: t.datas.slice(-7).map(d => d.dataValue)
      }));
      
      const prompt = lang === Language.ZH
        ? `分析以下最近7天的水电用量趋势。
           数据: ${JSON.stringify(simpleTrends)} (Type 2=电, 3=冷水, 4=热水)
           任务：
           1. 指出是否有异常的用量高峰 📈。
           2. 评价整体用量稳定性。
           3. 给出一条针对性的建议。
           格式：Markdown，使用 **粗体** 强调重点，使用 Emoji。`
        : `Analyze last 7 days utility trends. Data: ${JSON.stringify(simpleTrends)}. 
           Identify peaks 📈 and stability. Give 1 advice. Use Markdown & Emojis.`;

       if (this.provider === 'google') {
          return this.callGoogleGemini(prompt);
      } else {
          return this.callOpenAICompatible("You are a data analyst.", prompt);
      }
  }

  // Generic method for other tasks like Bill Calculation
  async ask(system: string, user: string): Promise<string> {
      if (!this.apiKey) throw new Error("API Key missing");

      if (this.provider === 'google') {
          return this.callGoogleGemini(system + "\n" + user);
      } else {
          return this.callOpenAICompatible(system, user);
      }
  }

  private async callGoogleGemini(fullPrompt: string): Promise<string> {
    const googleClient = await this.ensureGoogleClient();
    try {
        const response = await googleClient.models.generateContent({
            model: this.modelName,
            contents: fullPrompt,
            config: { temperature: 0.7 }
        });
        return response.text || "No response generated.";
    } catch (error: any) {
        console.error("Gemini SDK Error:", error);
        throw this.formatError(error);
    }
  }

  private async callOpenAICompatible(system: string, user: string): Promise<string> {
    if (!this.baseUrl) {
        throw new Error("Base URL is required for OpenAI Compatible provider.");
    }
    
    // Construct the endpoint. If user provided "https://dashscope.aliyuncs.com/compatible-mode/v1",
    // we append "/chat/completions".
    const url = `${this.baseUrl}/chat/completions`;

    const payload = {
        model: this.modelName,
        messages: [
            { role: "system", content: system },
            { role: "user", content: user }
        ],
        temperature: 0.7
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`API Error ${response.status}: ${errData}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        return content || "No content in response.";

    } catch (error: any) {
        console.error("OpenAI Compatible API Error:", error);
        throw this.formatError(error);
    }
  }

  private formatError(error: any): Error {
      let msg = error.message || "Unknown error";
      if (msg.includes("401")) msg = "Invalid API Key.";
      if (msg.includes("404")) msg = "Invalid URL or Model Name.";
      if (msg.includes("Failed to fetch")) msg = "Network Error. Check your Base URL.";
      return new Error(msg);
  }

  private async ensureGoogleClient() {
    if (this.provider !== 'google') {
      throw new Error("Google provider is not enabled.");
    }

    if (this.googleClient) {
      return this.googleClient;
    }

    if (!this.googleClientPromise) {
      this.googleClientPromise = this.createGoogleClient();
    }

    this.googleClient = await this.googleClientPromise;
    return this.googleClient;
  }

  private async createGoogleClient() {
    const { GoogleGenAI } = await import('@google/genai');
    const options: any = { apiKey: this.apiKey };

    if (this.baseUrl) {
      options.baseUrl = this.baseUrl;
    }

    return new GoogleGenAI(options);
  }
}

export const aiService = new AIService();
