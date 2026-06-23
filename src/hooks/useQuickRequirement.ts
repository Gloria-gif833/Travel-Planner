import { useState, useCallback } from 'react';
import { generateItinerary } from '../services/generateService';
import { createItinerary as saveItinerary } from '../services/itineraryService';
import { enrichItinerary } from '../utils/enrichItinerary';
import type { Requirements } from '../types/conversation';

/* ========================================
   快速需求采集表单状态
   ======================================== */

export interface QuickRequirementState {
  departure: string;
  destination: string;
  travelDate: string;
  days: string;
  preferences: string[];
  customPreference: string;
  additionalInfo: string;
}

export type QuickRequirementStep =
  | 'form'           // 填写表单
  | 'confirming'     // 提交后确认 + 询问素材
  | 'generating';    // 正在生成攻略

const INITIAL_STATE: QuickRequirementState = {
  departure: '',
  destination: '',
  travelDate: '',
  days: '',
  preferences: [],
  customPreference: '',
  additionalInfo: '',
};

export const PREFERENCE_OPTIONS = [
  { key: '自然风光', icon: '🏔️', label: '自然风光' },
  { key: '美食探店', icon: '🍜', label: '美食探店' },
  { key: '人文历史', icon: '🏛️', label: '人文历史' },
  { key: '购物休闲', icon: '🛍️', label: '购物休闲' },
  { key: '乐园游玩', icon: '🎢', label: '乐园游玩' },
  { key: '户外探险', icon: '🏕️', label: '户外探险' },
  { key: '打卡拍照', icon: '📸', label: '打卡拍照' },
  { key: '度假放松', icon: '🏖️', label: '度假放松' },
];

export const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export interface QuickRequirementActions {
  state: QuickRequirementState;
  step: QuickRequirementStep;
  summaryMessage: string;
  setField: (field: keyof QuickRequirementState, value: string) => void;
  togglePreference: (pref: string) => void;
  setCustomPreference: (value: string) => void;
  reset: () => void;
  submit: () => Promise<boolean>;
  isSubmittable: boolean;
}

export function useQuickRequirement(
  onNavigateToUpload?: () => void,
  onNavigateToItinerary?: () => void,
  onSaveToContext?: (requirements: Requirements) => void,
): QuickRequirementActions {
  const [state, setState] = useState<QuickRequirementState>(INITIAL_STATE);
  const [step, setStep] = useState<QuickRequirementStep>('form');
  const [summaryMessage, setSummaryMessage] = useState('');

  const setField = useCallback((field: keyof QuickRequirementState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const togglePreference = useCallback((pref: string) => {
    setState(prev => {
      const exists = prev.preferences.includes(pref);
      return {
        ...prev,
        preferences: exists
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref],
      };
    });
  }, []);

  const setCustomPreference = useCallback((value: string) => {
    setState(prev => ({ ...prev, customPreference: value }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setStep('form');
    setSummaryMessage('');
  }, []);

  const isSubmittable = state.destination.trim() !== '' && state.days !== '';

  const submit = useCallback(async (): Promise<boolean> => {
    if (!isSubmittable) return false;

    // 1. 构建完整的偏好文本
    const allPreferences = [...state.preferences];
    if (state.customPreference.trim()) {
      allPreferences.push(state.customPreference.trim());
    }
    const prefText = allPreferences.length > 0 ? allPreferences.join('、') : '';

    // 2. 构建需求摘要消息
    const items: string[] = [];
    if (state.destination) items.push(`📍 目的地：${state.destination}`);
    if (state.departure) items.push(`🚗 出发地：${state.departure}`);
    if (state.travelDate) items.push(`📅 时间：${state.travelDate}`);
    if (state.days) items.push(`⏱ 天数：${state.days}天`);
    if (prefText) items.push(`🎯 偏好：${prefText}`);

    const summary =
      `太好了！我已经收到你的出行计划 🌟\n\n` +
      `**📋 你填写的需求：**\n${items.join('\n')}\n\n` +
      (state.additionalInfo ? `**💡 补充信息：**\n${state.additionalInfo}\n\n` : '') +
      `你是否有查看过相关的旅游攻略或帖子是你比较感兴趣的？如果有的话可以上传一些素材，我能为你生成更精准的攻略哦 😊`;

    setSummaryMessage(summary);
    setStep('confirming');

    // 3. 保存到 ConversationContext（方便后续流程使用）
    const requirements: Requirements = {
      destination: state.destination,
      departure: state.departure,
      travelDate: state.travelDate,
      days: state.days,
      budget: '',
      companions: '',
      preferences: prefText,
      accommodation: '',
      transport: '',
    };

    if (onSaveToContext) {
      onSaveToContext(requirements);
    }

    return true;
  }, [state, isSubmittable, onSaveToContext]);

  return {
    state,
    step,
    summaryMessage,
    setField,
    togglePreference,
    setCustomPreference,
    reset,
    submit,
    isSubmittable,
  };
}