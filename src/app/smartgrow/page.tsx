import { MIcon } from '@/components/ui/MIcon';
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export default function Page() {
  return (
    <div className="min-h-screen bg-[var(--ak-surface-2)] flex flex-col font-inter text-on-surface">
      <LandingNav />
      
      <main className="flex-1 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-display-lg font-geist text-[var(--ak-text)] mb-6">SmartGrow Investments</h1>
          <p className="text-body-lg text-[var(--ak-text-2)] mb-12">Put idle group funds to work with vetted investment opportunities.</p>
          
          <div className="bg-white border border-[var(--ak-line)] rounded-2xl p-12 shadow-sm text-center">
            <MIcon name="construction"  className="text-[48px] text-[var(--ak-brand-ink)] mb-4" />
            <h2 className="text-headline-sm font-geist text-[var(--ak-text)] mb-2">Page Under Construction</h2>
            <p className="text-body-sm text-[var(--ak-text-2)]">We're currently building out this section. Check back soon.</p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
