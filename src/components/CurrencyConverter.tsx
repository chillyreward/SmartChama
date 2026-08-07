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
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Equivalent Value
        </span>
        <div className="flex gap-1">
          {currencies.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCurrency(c.code)}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                selectedCurrency === c.code
                  ? 'bg-[#22C55E] text-white'
                  : 'bg-[var(--bg-page)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] font-geist">
        {loading ? (
          <span className="animate-pulse text-[var(--text-muted)]">Loading...</span>
        ) : (
          <>{selected.symbol}{converted} <span className="text-sm font-normal text-[var(--text-secondary)]">{selected.code}</span></>
        )}
      </div>
      {rates && (
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          Rate as of {rates.date} · Powered by Frankfurter API
        </p>
      )}
    </div>
  );
}
