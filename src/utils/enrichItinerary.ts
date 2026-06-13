import type { ItineraryData, ItineraryMeta } from '../types/itinerary';
import type { Requirements } from '../types/conversation';

/**
 * 将用户需求中的元数据注入攻略数据
 * 攻略数据本身不包含"同行人员"、"出行时间"等元信息，
 * 这些信息存储在 ConversationContext.requirements 中，
 * 需要在 dispatch SET_ITINERARY 前注入到 ItineraryData.metadata
 */
export function enrichItinerary(
  itinerary: ItineraryData,
  requirements: Requirements | Record<string, string>
): ItineraryData {
  const meta: ItineraryMeta = {
    companions: requirements.companions || undefined,
    travelDate: requirements.travelDate || undefined,
    preferences: requirements.preferences || undefined,
    departure: requirements.departure || undefined,
    destination: requirements.destination || undefined,
    days: requirements.days || undefined,
    budget: requirements.budget || undefined,
  };

  return { ...itinerary, metadata: meta };
}