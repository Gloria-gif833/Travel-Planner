/* ========================================
   对话数据类型定义
   ======================================== */

export interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export type RequirementKey =
  | 'destination'
  | 'departure'
  | 'days'
  | 'budget'
  | 'companions'
  | 'preferences'
  | 'accommodation'
  | 'transport'
  | 'travelDate';

export interface Requirements {
  destination: string;
  departure: string;
  days: string;
  budget: string;
  companions: string;
  preferences: string;
  accommodation: string;
  transport: string;
  travelDate: string;
}

export interface RequirementField {
  key: RequirementKey;
  label: string;
  placeholder: string;
  completed: boolean;
}

export const REQUIREMENT_FIELDS: RequirementField[] = [
  { key: 'destination', label: '目的地', placeholder: '想去哪里？', completed: false },
  { key: 'departure', label: '出发地', placeholder: '从哪里出发？', completed: false },
  { key: 'travelDate', label: '出行时间', placeholder: '什么时候去？', completed: false },
  { key: 'days', label: '出行天数', placeholder: '玩几天？', completed: false },
  { key: 'budget', label: '预算范围', placeholder: '预算多少？', completed: false },
  { key: 'companions', label: '同行人员', placeholder: '和谁去？', completed: false },
  { key: 'preferences', label: '游玩偏好', placeholder: '喜欢什么玩法？', completed: false },
  { key: 'accommodation', label: '住宿偏好', placeholder: '住宿要求？', completed: false },
  { key: 'transport', label: '交通偏好', placeholder: '飞机/火车/自驾？', completed: false },
];

export type ConversationStep =
  | 'greeting'
  | 'asking_destination'
  | 'asking_days'
  | 'asking_budget'
  | 'asking_companions'
  | 'asking_preferences'
  | 'asking_accommodation'
  | 'completed'
  | 'asking_materials';

export const STEP_QUESTIONS: Record<ConversationStep, string> = {
  greeting: '你好！欢迎来到 Travel Planner 🎉\n\n我是你的私人旅行规划助手，接下来我会问你几个问题，帮你定制一份完美的旅行攻略！',
  asking_destination: '首先，你想去哪里旅行呀？🏖️',
  asking_days: '好目的地！打算玩几天呢？📅',
  asking_budget: '了解了！这次旅行大概预算是多少呢？（比如：5000-8000、1万-1.5万）💰',
  asking_companions: '好的～是独自旅行、情侣出游、朋友结伴还是带家人一起去呢？👥',
  asking_preferences: '你更喜欢什么类型的玩法？自然风光、美食探店、人文历史、购物休闲，还是都想要？🎯',
  asking_accommodation: '最后，住宿方面有什么偏好吗？比如民宿、酒店、青旅，或者对位置有要求？🏨',
  completed: '',
  asking_materials: '好的！你的需求我都记下啦 ✅\n\n你是否有查看过相关的旅游攻略或帖子是你比较感兴趣的？如果有的话可以上传一些素材，我能为你生成更精准的攻略哦 😊',
};