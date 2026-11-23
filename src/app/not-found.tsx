import { ButtonLink, Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-page text-ink flex flex-col">
      <header className="px-5 sm:px-10 h-[72px] flex items-center">
        <Logo size="sm" />
      </header>
      <main className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="max-w-[460px]">
          <p className="font-money text-[88px] leading-none text-brand">404</p>
          <h1 className="font-display text-[36px] leading-tight tracking-[-0.02em] mt-4">This page isn&apos;t here</h1>
          <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">
            The link may be old or mistyped. If someone sent it to you, ask them to check it.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <ButtonLink href="/dashboard">Go to my group</ButtonLink>
            <ButtonLink href="/" variant="outline">Akibora home</ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}
