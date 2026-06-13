import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Message } from '../types/conversation';

/* ========================================
   AI 调整对话状态管理
   ======================================== */

interface AiAdjustState {
  messages: Message[];
  isProcessing: boolean;
}

type AiAdjustAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'CLEAR_MESSAGES' };

const initialState: AiAdjustState = {
  messages: [],
  isProcessing: false,
};

let msgIdCounter = 0;
function generateMsgId() {
  msgIdCounter += 1;
  return `aiadj_${Date.now()}_${msgIdCounter}`;
}

function aiAdjustReducer(
  state: AiAdjustState,
  action: AiAdjustAction
): AiAdjustState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
}

interface AiAdjustContextValue {
  state: AiAdjustState;
  dispatch: React.Dispatch<AiAdjustAction>;
  generateMsgId: typeof generateMsgId;
}

const AiAdjustContext = createContext<AiAdjustContextValue | null>(null);

export function AiAdjustProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(aiAdjustReducer, initialState);

  return (
    <AiAdjustContext.Provider value={{ state, dispatch, generateMsgId }}>
      {children}
    </AiAdjustContext.Provider>
  );
}

export function useAiAdjustContext() {
  const ctx = useContext(AiAdjustContext);
  if (!ctx) {
    throw new Error('useAiAdjustContext must be used within AiAdjustProvider');
  }
  return ctx;
}

export { generateMsgId };