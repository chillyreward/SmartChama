export function getInviteQRUrl(groupCode: string, size: number = 200): string {
  const joinUrl = `https://smartchama.vercel.app/signup?code=${encodeURIComponent(groupCode)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(joinUrl)}&color=22C55E&bgcolor=FFFFFF&format=png`;
}

export function getJoinUrl(groupCode: string): string {
  return `https://smartchama.vercel.app/signup?code=${encodeURIComponent(groupCode)}`;
}
