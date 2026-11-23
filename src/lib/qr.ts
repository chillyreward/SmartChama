import { SITE } from '@/lib/site';

export function getInviteQRUrl(groupCode: string, size: number = 200): string {
  const joinUrl = `${SITE.url}/signup?role=member&code=${encodeURIComponent(groupCode)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(joinUrl)}&color=0E1F18&bgcolor=FFFFFF&format=png`;
}

export function getJoinUrl(groupCode: string): string {
  return `${SITE.url}/signup?role=member&code=${encodeURIComponent(groupCode)}`;
}
