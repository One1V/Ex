// Centralized video config supporting Daily or Jitsi
// Provider: 'jitsi' (default) | 'daily'
export const VIDEO_PROVIDER = ((import.meta as any)?.env?.VITE_VIDEO_PROVIDER || 'jitsi').toLowerCase();

// Daily settings
export const DAILY_DOMAIN = (import.meta as any)?.env?.VITE_DAILY_DOMAIN || 'examido';
export function dailyRoomUrl(roomId: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomId}`;
}

// Jitsi settings
export const JITSI_DOMAIN = (import.meta as any)?.env?.VITE_JITSI_DOMAIN || 'meet.jit.si';
export function jitsiRoomUrl(roomId: string): string {
  return `https://${JITSI_DOMAIN}/${roomId}`;
}

export function buildMeetingUrl(roomId: string): string {
  return VIDEO_PROVIDER === 'daily' ? dailyRoomUrl(roomId) : jitsiRoomUrl(roomId);
}
