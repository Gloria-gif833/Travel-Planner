import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Message, Requirements, RequirementKey } from '../types/conversation';
import type { Material } from '../types/material';

/* ========================================
   Conversation Context — 对话状态管理
   ======================================== */

interface ConversationState {
  messages: Message[];
  requirements: Requirements;
  completedRequirements: RequirementKey[];
  currentStep: string;
  materials: Material[];
  initialized: boolean;
  pendingGeneration: boolean;
}

type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; text: string } }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'UPDATE_REQUIREMENT'; payload: { key: RequirementKey; value: string } }
  | { type: 'ADD_MATERIAL'; payload: Material }
  | { type: 'REMOVE_MATERIAL'; payload: string }
  | { type: 'CLEAR_MATERIALS' }
  | { type: 'RESTORE_MATERIALS'; payload: Material[] }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_PENDING_GENERATION'; payload: boolean }
  | { type: 'RESET' };

const initialState: ConversationState = {
  messages: [],
  requirements: {
    destination: '',
    departure: '',
    travelDate: '',
    days: '',
    budget: '',
    companions: '',
    preferences: '',
    accommodation: '',
    transport: '',
  },
  completedRequirements: [],
  currentStep: 'greeting',
  materials: [],
  initialized: false,
  pendingGeneration: false,
};

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, text: action.payload.text } : m
        ),
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'UPDATE_REQUIREMENT':
      return {
        ...state,
        requirements: {
          ...state.requirements,
          [action.payload.key]: action.payload.value,
        },
        completedRequirements: state.completedRequirements.includes(action.payload.key)
          ? state.completedRequirements
          : [...state.completedRequirements, action.payload.key],
      };

    case 'ADD_MATERIAL':
      return {
        ...state,
        materials: [...state.materials, action.payload],
      };

    case 'REMOVE_MATERIAL':
      return {
        ...state,
        materials: state.materials.filter((m) => m.id !== action.payload),
      };

    case 'CLEAR_MATERIALS':
      return {
        ...state,
        materials: [],
      };

    case 'RESTORE_MATERIALS':
      return {
        ...state,
        materials: action.payload,
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        initialized: action.payload,
      };

    case 'SET_PENDING_GENERATION':
      return {
        ...state,
        pendingGeneration: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface ConversationContextValue {
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return ctx;
}