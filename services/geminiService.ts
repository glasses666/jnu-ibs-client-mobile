
import { GoogleGenAI } from "@google/genai";
import { OverviewData, MetricalDataResult, Language, AIProvider } from "../types";

export class AIService {
  private googleClient: GoogleGenAI | null = null;
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

    if (this.provider === 'google') {
        const options: any = { apiKey: this.apiKey };
        if (this.baseUrl) {
            options.baseUrl = this.baseUrl;
        }
        this.googleClient = new GoogleGenAI(options);
    }
  }

  async generateSummary(
    overview: OverviewData, 
    trends: MetricalDataResult[], 
    lang: Language
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("API Key missing. Please configure it in Settings.");
    }

    const dataContext = JSON.stringify({
      balance: overview.balance,
      costs: overview.costs,
      usage: overview.details,
      subsidy: overview.subsidy, // Included subsidy info
      trends: trends.map(t => ({
        type: t.energyType, // 2=Elec, 3=Cold, 4=Hot
        points: t.datas.length 
      }))
    });

    const langInstruction = lang === Language.ZH 
      ? "请用中文回答。语气亲切专业。请务必使用 Markdown 格式（例如用 **粗体** 标注关键数字），并搭配适量 Emoji 🌟。" 
      : "Please answer in English. Use Markdown (e.g. **bold** numbers) and Emojis 🌟.";

    const systemPrompt = `
      You are an energy efficiency assistant for a university student living in a dorm.
      Task:
      1. Analyze the current month's financial status and usage mix.
      2. Identify the main cost driver.
      3. Provide 3 specific, actionable money-saving tips.
      Format: Use Markdown bullet points. Keep it structured and concise.
    `;

    const userPrompt = `
      ${langInstruction}
      Data:
      ${dataContext}
    `;

    if (this.provider === 'google') {
        return this.callGoogleGemini(systemPrompt + "\n" + userPrompt);
    } else {
        return this.callOpenAICompatible(systemPrompt, userPrompt);
    }
  }

  async generateDailyBrief(overview: OverviewData, lang: Language, weather?: any): Promise<string> {
      if (!this.apiKey) return "";
      
      const weatherCtx = weather 
        ? `今天天气: ${weather.place} ${weather.weather}, ${weather.temperature}°C.` 
        : "";

      const prompt = lang === Language.ZH
        ? `作为宿舍小助手，请根据当前余额 ¥${overview.balance} 和总支出 ¥${overview.costs.total}，以及${weatherCtx}，写一句**极简短**的早安/问候语（不超过20字）。
           要求：元气满满，包含1-2个Emoji 🌤️。结合天气给出温馨提示（如带伞、防晒等）。`
        : `Write a VERY short (max 15 words) cheerful daily greeting based on Balance ¥${overview.balance} and Weather (${weatherCtx}). Use Emojis 🌤️.`;
        
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
    if (!this.googleClient) throw new Error("Google Client not initialized");
    try {
        const response = await this.googleClient.models.generateContent({
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
}

export const aiService = new AIService();
