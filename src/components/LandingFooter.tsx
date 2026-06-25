import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="bg-[#0B0F0C] text-white pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="SmartChama"
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain brightness-0 invert"
                  priority
                />
                <span className="text-[20px] font-bold text-white tracking-tight">
                  SmartChama
                </span>
              </div>
            </Link>
            <p className="text-body-sm text-gray-400 mb-6">Financial infrastructure for community wealth.</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">link</span></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">forum</span></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/#features" className="text-body-sm text-gray-300 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-body-sm text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="text-body-sm text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/smartgrow" className="text-body-sm text-gray-300 hover:text-white transition-colors">SmartGrow</Link></li>
              <li><Link href="/security" className="text-body-sm text-gray-300 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-body-sm text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-body-sm text-gray-300 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="text-body-sm text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-body-sm text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-label-caps text-gray-500 uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/terms" className="text-body-sm text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-body-sm text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="text-body-sm text-gray-300 hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-body-sm text-gray-500 text-center md:text-left">
            © 2026 SmartChama Technologies Ltd. Built in Nairobi, Kenya.
          </div>
          <div className="text-body-sm text-gray-500">
            Regulated by the Central Bank of Kenya.
          </div>
        </div>
      </div>
    </footer>
  );
}
