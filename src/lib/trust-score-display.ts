export function getTrustStatusLabel(score: number): { label: string, color: string } {
  if (score >= 80) return { label: 'Excellent Standing', color: '#006e2f' };
  if (score >= 60) return { label: 'Good Standing', color: '#006e2f' };
  if (score >= 40) return { label: 'Fair Standing', color: '#854d0e' };
  return { label: 'Needs Attention', color: '#991b1b' };
}
