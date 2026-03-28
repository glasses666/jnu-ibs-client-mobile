import { EnergyType, Language, type MetricalDataResult, type OverviewData } from '../types.js';

type RechargePlanInputsArgs = {
  overview: OverviewData;
  trends: MetricalDataResult[];
  daysToCover: number;
  roommates: number;
};

type RechargePlanPromptArgs = {
  lang: Language;
  inputs: RechargePlanInputs;
};

export type RechargePlanInputs = {
  dailyCosts: {
    elec: number;
    cold: number;
    hot: number;
  };
  subsidies: {
    elec: number;
    cold: number;
    hot: number;
  };
  balance: number;
  daysToCover: number;
  roommates: number;
};

const roundMoney = (value: number) => parseFloat(value.toFixed(2));

const calculateDailyCost = (
  trends: MetricalDataResult[],
  energyType: EnergyType,
  defaultPrice: number
) => {
  const trend = trends.find((item) => Number(item.energyType) === energyType);

  if (!trend || trend.datas.length === 0) {
    return 0;
  }

  const recent = trend.datas.slice(-5);
  const averageUsage = recent.reduce((total, entry) => total + entry.dataValue, 0) / recent.length;

  return roundMoney(averageUsage * defaultPrice);
};

export const calculateRechargePlanInputs = ({
  overview,
  trends,
  daysToCover,
  roommates,
}: RechargePlanInputsArgs): RechargePlanInputs => ({
  dailyCosts: {
    elec: calculateDailyCost(trends, EnergyType.ELEC, 0.647),
    cold: calculateDailyCost(trends, EnergyType.COLD_WATER, 2.82),
    hot: calculateDailyCost(trends, EnergyType.HOT_WATER, 25),
  },
  subsidies: {
    elec: overview.subsidyMoney?.elec || 0,
    cold: overview.subsidyMoney?.cold || 0,
    hot: overview.subsidyMoney?.hot || 0,
  },
  balance: overview.balance,
  daysToCover,
  roommates,
});

export const createRechargePrompt = ({ lang, inputs }: RechargePlanPromptArgs) => {
  const systemPrompt = 'You are a precise billing assistant.';

  const userPrompt = lang === Language.ZH
    ? `请计算充值方案。注意：补贴是专款专用的（电补只能抵电费）。
       
       数据详情：
       1. ⚡ 电费: 日均消耗 ¥${inputs.dailyCosts.elec.toFixed(2)}, 剩余补贴 ¥${inputs.subsidies.elec.toFixed(2)}
       2. 💧 冷水: 日均消耗 ¥${inputs.dailyCosts.cold.toFixed(2)}, 剩余补贴 ¥${inputs.subsidies.cold.toFixed(2)}
       3. 🔥 热水: 日均消耗 ¥${inputs.dailyCosts.hot.toFixed(2)}, 剩余补贴 ¥${inputs.subsidies.hot.toFixed(2)}
       
       账户通用余额: ¥${inputs.balance.toFixed(2)}
       目标天数: ${inputs.daysToCover}天
       宿舍人数: ${inputs.roommates}人
       
       计算逻辑:
       1. 分别计算每种资源的总需求 = 日均 * 天数。
       2. 每种资源的净需求 = MAX(0, 总需求 - 该资源的剩余补贴)。
       3. 总净需求 = 电净需求 + 冷净需求 + 热净需求。
       4. 最终需充值 = MAX(0, 总净需求 - 账户通用余额)。
       
       请输出 Markdown:
       - **需充值总额**: (向上取整到10元)
       - **人均**: (精确到分)
       - **分析**: 简述计算，提到各项补贴抵扣情况。
       - 📋 **文案**: 幽默催款。`
    : `Calculate recharge. Subsidies are specific to utility type.
       
       Data:
       1. Elec: Daily ¥${inputs.dailyCosts.elec.toFixed(2)}, Subsidy ¥${inputs.subsidies.elec.toFixed(2)}
       2. Cold: Daily ¥${inputs.dailyCosts.cold.toFixed(2)}, Subsidy ¥${inputs.subsidies.cold.toFixed(2)}
       3. Hot: Daily ¥${inputs.dailyCosts.hot.toFixed(2)}, Subsidy ¥${inputs.subsidies.hot.toFixed(2)}
       
       Main Balance: ¥${inputs.balance.toFixed(2)}
       Days: ${inputs.daysToCover}
       
       Logic:
       NetNeed_Type = MAX(0, (Daily * Days) - Subsidy_Type)
       TotalNeed = Sum(NetNeed_Types) - MainBalance
       
       Output Markdown: Total, Per Person, Analysis, Message.`;

  return { systemPrompt, userPrompt };
};
