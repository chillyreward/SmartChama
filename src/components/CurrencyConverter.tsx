'use client';

import { useState, useEffect } from 'react';
import { getKESRates, convertFromKES, type ExchangeRates } from '@/lib/currency';

interface Props {
  amountKES: number;
}

export default function CurrencyConverter({ amountKES }: Props) {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKESRates().then(r => { setRates(r); setLoading(false); });
  }, []);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  const selected = currencies.find(c => c.code === selectedCurrency)!;
  const converted = rates ? convertFromKES(amountKES, rates, selectedCurrency) : '—';

  return (
    <div className="rounded-[24px] bg-surface border border-line p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-ink-2">Worth abroad</span>
        <div role="group" aria-label="Currency" className="flex gap-1 p-1 rounded-full bg-surface-2">
          {currencies.map(c => (
            <button
              key={c.code}
              type="button"
              aria-pressed={selectedCurrency === c.code}
              onClick={() => setSelectedCurrency(c.code)}
              className={`h-8 px-3 rounded-full text-[12px] font-semibold transition-colors ${selectedCurrency === c.code ? 'bg-primary text-on-primary' : 'text-ink-3 hover:text-ink'}`}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>
      <div className="font-money text-[30px] mt-2">
        {loading ? <span className="text-ink-3 text-[16px] font-sans">Getting today&apos;s rate…</span> : <>{selected.symbol}{converted} <span className="text-[14px] font-sans text-ink-3">{selected.code}</span></>}
      </div>
      {rates && <p className="text-[12px] text-ink-3 mt-1">Rate from {rates.date}, via the Frankfurter API.</p>}
    </div>
  );
}
