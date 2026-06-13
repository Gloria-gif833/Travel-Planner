/** 获取/生成访客唯一标识，持久化到 localStorage */

let _guestId: string | null = null;

export function getGuestId(): string {
  if (_guestId) return _guestId;

  const stored = localStorage.getItem('travel_planner_guest_id');
  if (stored) {
    _guestId = stored;
    return _guestId;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem('travel_planner_guest_id', newId);
  _guestId = newId;
  return _guestId;
}