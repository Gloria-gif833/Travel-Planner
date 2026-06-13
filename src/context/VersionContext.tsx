import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { VersionSnapshot, ChangeType } from '../types/version';

/* ========================================
   Version Context — 版本快照管理
   ======================================== */

let versionIdCounter = 0;
function generateVersionId() {
  versionIdCounter += 1;
  return `ver_${Date.now()}_${versionIdCounter}`;
}

interface VersionState {
  versions: VersionSnapshot[];
  currentVersionNumber: number;
}

type VersionAction =
  | { type: 'ADD_SNAPSHOT'; payload: VersionSnapshot }
  | { type: 'SET_CURRENT_VERSION'; payload: number }
  | { type: 'CLEAR' };

const initialState: VersionState = {
  versions: [],
  currentVersionNumber: 0,
};

function versionReducer(
  state: VersionState,
  action: VersionAction
): VersionState {
  switch (action.type) {
    case 'ADD_SNAPSHOT':
      return {
        ...state,
        versions: [...state.versions, action.payload],
        currentVersionNumber: action.payload.versionNumber,
      };
    case 'SET_CURRENT_VERSION':
      return {
        ...state,
        currentVersionNumber: action.payload,
      };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface VersionContextValue {
  state: VersionState;
  dispatch: React.Dispatch<VersionAction>;
  generateSnapshot: (
    itineraryId: string,
    itineraryData: object,
    changeType: ChangeType,
    changeSummary: string
  ) => void;
  rollbackToVersion: (
    targetVersionNumber: number,
    allVersions: VersionSnapshot[]
  ) => VersionSnapshot | null;
}

const VersionContext = createContext<VersionContextValue | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(versionReducer, initialState);

  const generateSnapshot = (
    itineraryId: string,
    itineraryData: object,
    changeType: ChangeType,
    changeSummary: string
  ) => {
    const nextNumber = state.versions.length + 1;
    const snapshot: VersionSnapshot = {
      id: generateVersionId(),
      versionNumber: nextNumber,
      itineraryId,
      data: JSON.stringify(itineraryData),
      changeType,
      changeSummary,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SNAPSHOT', payload: snapshot });
  };

  const rollbackToVersion = (
    targetVersionNumber: number,
    allVersions: VersionSnapshot[]
  ): VersionSnapshot | null => {
    const target = allVersions.find(
      (v) => v.versionNumber === targetVersionNumber
    );
    if (!target) return null;

    // 回退操作本身也生成一条新记录
    const newSnapshot: VersionSnapshot = {
      id: generateVersionId(),
      versionNumber: allVersions.length + 1,
      itineraryId: target.itineraryId,
      data: target.data,
      changeType: 'manual',
      changeSummary: `回退到版本 v${targetVersionNumber}`,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SNAPSHOT', payload: newSnapshot });
    return newSnapshot;
  };

  return (
    <VersionContext.Provider
      value={{ state, dispatch, generateSnapshot, rollbackToVersion }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const ctx = useContext(VersionContext);
  if (!ctx) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return ctx;
}