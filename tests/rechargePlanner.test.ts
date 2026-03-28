import test from 'node:test';
import assert from 'node:assert/strict';

import { EnergyType, Language } from '../types.js';
import {
  calculateRechargePlanInputs,
  createRechargePrompt,
  generateRechargePlan,
} from '../utils/rechargePlanner.js';

const overview = {
  room: 'T8201',
  balance: 124.5,
  costs: { elec: 85.2, cold: 24.5, hot: 12, total: 121.7 },
  subsidy: { elec: 15.5, cold: 5, hot: 0 },
  subsidyMoney: { elec: 10.03, cold: 14.1, hot: 0 },
  details: {
    elec: [131.6, 0.647] as [number, number],
    cold: [8.7, 2.82] as [number, number],
    hot: [0.48, 25] as [number, number],
  },
};

test('calculateRechargePlanInputs averages the latest five trend points per utility type', () => {
  const inputs = calculateRechargePlanInputs({
    overview,
    trends: [
      {
        energyType: EnergyType.ELEC,
        datas: [1, 2, 3, 4, 5, 6].map((dataValue, index) => ({
          recordTime: new Date(2026, 2, index + 1).getTime(),
          dataValue,
        })),
      },
      {
        energyType: EnergyType.COLD_WATER,
        datas: [0.5, 0.6, 0.7, 0.8, 0.9].map((dataValue, index) => ({
          recordTime: new Date(2026, 2, index + 1).getTime(),
          dataValue,
        })),
      },
      {
        energyType: EnergyType.HOT_WATER,
        datas: [0.1, 0.2].map((dataValue, index) => ({
          recordTime: new Date(2026, 2, index + 1).getTime(),
          dataValue,
        })),
      },
    ],
    daysToCover: 30,
    roommates: 4,
  });

  assert.equal(inputs.dailyCosts.elec, 2.59);
  assert.equal(inputs.dailyCosts.cold, 1.97);
  assert.equal(inputs.dailyCosts.hot, 3.75);
  assert.equal(inputs.subsidies.elec, 10.03);
  assert.equal(inputs.balance, 124.5);
});

test('createRechargePrompt renders the Chinese billing brief with rounded utility values', () => {
  const prompt = createRechargePrompt({
    lang: Language.ZH,
    inputs: {
      dailyCosts: { elec: 2.59, cold: 1.97, hot: 3.75 },
      subsidies: { elec: 10.03, cold: 14.1, hot: 0 },
      balance: 124.5,
      daysToCover: 30,
      roommates: 4,
    },
  });

  assert.equal(prompt.systemPrompt, 'You are a precise billing assistant.');
  assert.match(prompt.userPrompt, /目标天数: 30天/);
  assert.match(prompt.userPrompt, /宿舍人数: 4人/);
  assert.match(prompt.userPrompt, /⚡ 电费: 日均消耗 ¥2\.59, 剩余补贴 ¥10\.03/);
  assert.match(prompt.userPrompt, /💧 冷水: 日均消耗 ¥1\.97, 剩余补贴 ¥14\.10/);
});

test('createRechargePrompt renders the English billing brief', () => {
  const prompt = createRechargePrompt({
    lang: Language.EN,
    inputs: {
      dailyCosts: { elec: 2.59, cold: 1.97, hot: 3.75 },
      subsidies: { elec: 10.03, cold: 14.1, hot: 0 },
      balance: 124.5,
      daysToCover: 14,
      roommates: 4,
    },
  });

  assert.match(prompt.userPrompt, /Days: 14/);
  assert.match(prompt.userPrompt, /Main Balance: ¥124\.50/);
  assert.match(prompt.userPrompt, /1\. Elec: Daily ¥2\.59, Subsidy ¥10\.03/);
  assert.match(prompt.userPrompt, /Output Markdown: Total, Per Person, Analysis, Message\./);
});

test('generateRechargePlan initializes the AI client and returns its markdown response', async () => {
  const calls: {
    initialized?: {
      apiKey: string;
      aiBaseUrl: string;
      aiProvider: 'google' | 'openai';
      aiModel: string;
    };
    prompt?: {
      system: string;
      user: string;
    };
  } = {};

  const response = await generateRechargePlan({
    aiClient: {
      initialize(apiKey, aiBaseUrl, aiProvider, aiModel) {
        calls.initialized = { apiKey, aiBaseUrl, aiProvider, aiModel };
      },
      ask(system, user) {
        calls.prompt = { system, user };
        return Promise.resolve('**需充值总额**: ¥120');
      },
    },
    ai: {
      apiKey: 'sk-demo',
      aiBaseUrl: 'https://proxy.example.com/v1',
      aiProvider: 'openai',
      aiModel: 'qwen-plus',
    },
    lang: Language.ZH,
    overview,
    trends: [
      {
        energyType: EnergyType.ELEC,
        datas: [3, 4, 5].map((dataValue, index) => ({
          recordTime: new Date(2026, 2, index + 1).getTime(),
          dataValue,
        })),
      },
    ],
    daysToCover: 21,
    roommates: 4,
  });

  assert.equal(response, '**需充值总额**: ¥120');
  assert.deepEqual(calls.initialized, {
    apiKey: 'sk-demo',
    aiBaseUrl: 'https://proxy.example.com/v1',
    aiProvider: 'openai',
    aiModel: 'qwen-plus',
  });
  assert.equal(calls.prompt?.system, 'You are a precise billing assistant.');
  assert.match(calls.prompt?.user || '', /目标天数: 21天/);
});
