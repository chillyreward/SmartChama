const FRANKFURTER_BASE = 'https://api.frankfurter.app';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function getKESRates(): Promise<ExchangeRates | null> {
  try {
    const res = await fetch(`${FRANKFURTER_BASE}/latest?from=KES&to=USD,EUR,GBP`, {
      next: { revalidate: 3600 } // Cache for 1 hour in Next.js
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function convertFromKES(amountKES: number, rates: ExchangeRates, currency: string): string {
  const rate = rates.rates[currency];
  if (!rate) return '—';
  return (amountKES * rate).toFixed(2);
}
