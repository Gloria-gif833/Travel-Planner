import { createContext, useContext, type ReactNode } from 'react';

interface DragContextValue {
  onDragStart: (spotId: string) => void;
  onDrop: (targetSpotId: string) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext() {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDragContext must be used within DragProvider');
  return ctx;
}

interface DragProviderProps {
  children: ReactNode;
  onReorder: (fromId: string, toId: string) => void;
}

export function DragProvider({ children, onReorder }: DragProviderProps) {
  const draggedIdRef = { current: '' };

  const handleDragStart = (spotId: string) => {
    draggedIdRef.current = spotId;
  };

  const handleDrop = (targetSpotId: string) => {
    if (draggedIdRef.current && draggedIdRef.current !== targetSpotId) {
      onReorder(draggedIdRef.current, targetSpotId);
    }
    draggedIdRef.current = '';
  };

  return (
    <DragContext.Provider value={{ onDragStart: handleDragStart, onDrop: handleDrop }}>
      {children}
    </DragContext.Provider>
  );
}