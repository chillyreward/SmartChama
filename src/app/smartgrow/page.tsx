import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />
      
      <main className="flex-1 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-display-lg font-geist text-[#161d16] mb-6">SmartGrow Investments</h1>
          <p className="text-body-lg text-[#3d4a3d] mb-12">Put idle group funds to work with vetted investment opportunities.</p>
          
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 shadow-sm text-center">
            <span className="material-symbols-outlined text-[48px] text-[#006e2f] mb-4">construction</span>
            <h2 className="text-headline-sm font-geist text-[#161d16] mb-2">Page Under Construction</h2>
            <p className="text-body-sm text-[#60645f]">We're currently building out this section. Check back soon.</p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
