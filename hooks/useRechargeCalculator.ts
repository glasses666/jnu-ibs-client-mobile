import { useState } from 'react';

import { aiService } from '../services/geminiService.js';
import type { AIProvider, Language, MetricalDataResult, OverviewData } from '../types.js';
import { generateRechargePlan } from '../utils/rechargePlanner.js';

type UseRechargeCalculatorArgs = {
  canUseAiFeatures: boolean;
  ai: {
    apiKey: string;
    aiBaseUrl: string;
    aiProvider: AIProvider;
    aiModel: string;
  };
  lang: Language;
  overview: OverviewData | null;
  trends: MetricalDataResult[];
};

export const useRechargeCalculator = ({
  canUseAiFeatures,
  ai,
  lang,
  overview,
  trends,
}: UseRechargeCalculatorArgs) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [roommates, setRoommates] = useState(4);
  const [daysToCover, setDaysToCover] = useState(30);
  const [calcResult, setCalcResult] = useState('');
  const [isCalcLoading, setIsCalcLoading] = useState(false);

  const handleCalculateRecharge = async () => {
    if (!overview || !canUseAiFeatures) {
      return;
    }

    setIsCalcLoading(true);
    setCalcResult('');

    try {
      const response = await generateRechargePlan({
        aiClient: aiService,
        ai,
        lang,
        overview,
        trends,
        daysToCover,
        roommates,
      });
      setCalcResult(response);
    } catch (error: any) {
      setCalcResult(`Error: ${error.message}`);
    } finally {
      setIsCalcLoading(false);
    }
  };

  return {
    showCalculator,
    openCalculator: () => setShowCalculator(true),
    closeCalculator: () => setShowCalculator(false),
    roommates,
    setRoommates,
    daysToCover,
    setDaysToCover,
    calcResult,
    isCalcLoading,
    handleCalculateRecharge,
  };
};
