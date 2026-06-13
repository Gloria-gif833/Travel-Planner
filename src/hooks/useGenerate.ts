import { useState, useCallback } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useItinerary } from '../context/ItineraryContext';
import { generateItinerary } from '../services/generateService';
import type { ItineraryData } from '../types/itinerary';

/* ========================================
   useGenerate Hook — 攻略生成逻辑
   ======================================== */

export function useGenerate() {
  const { state: convState } = useConversation();
  const { dispatch } = useItinerary();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const { requirements, materials } = convState;
      const response = await generateItinerary(
        requirements,
        materials.map((m) => ({
          type: m.type,
          content: m.type === 'text' ? m.content : m.content,
        }))
      );

      const itineraryData = response.itinerary as ItineraryData;
      dispatch({ type: 'SET_ITINERARY', payload: itineraryData });
      dispatch({
        type: 'ADD_TO_LIST',
        payload: itineraryData,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [convState, dispatch]);

  return {
    generating,
    error,
    handleGenerate,
  };
}