'use client';

import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] flex items-center justify-center p-6 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Akibora"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
        </div>

        <h1 className="text-[48px] font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] leading-none mb-2 font-geist">
          404
        </h1>
        <h2 className="text-[20px] font-semibold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] mb-3">
          Page not found
        </h2>
        <p className="text-[15px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <a 
            href="/"
            className="bg-[var(--ak-solid)] text-white px-6 py-3 rounded-lg text-[15px] font-semibold hover:bg-[var(--ak-solid)] transition-colors"
          >
            Go to Home
          </a>
          <a 
            href="/dashboard"
            className="bg-white dark:bg-[var(--ak-surface)] border border-[var(--ak-line)] dark:border-[var(--ak-line)] text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] px-6 py-3 rounded-lg text-[15px] font-semibold hover:bg-gray-50 dark:hover:bg-[var(--ak-raised)] transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
