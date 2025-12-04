
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
      trends: trends.map(t => ({
        type: t.energyType, // 2=Elec, 3=Cold, 4=Hot
        points: t.datas.length 
      }))
    });

    const langInstruction = lang === Language.ZH 
      ? "请用中文回答。使用亲切、专业的语气。" 
      : "Please answer in English. Use a friendly and professional tone.";

    const systemPrompt = `
      You are an energy efficiency assistant for a university student living in a dorm.
      Task:
      1. Briefly summarize the current financial status (Balance and Total Cost this month).
      2. Analyze usage trends. Identify which utility is the major cost driver.
      3. Provide 3 specific, actionable tips to save money based on the data.
      Output plain text only. Keep it concise (under 200 words).
    `;

    const userPrompt = `
      ${langInstruction}
      Here is the user's utility usage data (JSON format):
      ${dataContext}
    `;

    if (this.provider === 'google') {
        return this.callGoogleGemini(systemPrompt + "\n" + userPrompt);
    } else {
        return this.callOpenAICompatible(systemPrompt, userPrompt);
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
