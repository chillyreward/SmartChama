const fs = require('fs');
const path = require('path');

const pages = [
  { slug: 'about', title: 'About SmartChama', desc: 'Financial infrastructure for community wealth.' },
  { slug: 'careers', title: 'Careers', desc: 'Join us in building the future of African finance.' },
  { slug: 'blog', title: 'Blog', desc: 'Latest updates, insights, and stories from our community.' },
  { slug: 'contact', title: 'Contact Us', desc: 'Get in touch with our team in Nairobi.' },
  { slug: 'terms', title: 'Terms of Service', desc: 'Please read these terms carefully before using SmartChama.' },
  { slug: 'privacy', title: 'Privacy Policy', desc: 'How we protect and handle your group financial data.' },
  { slug: 'cookies', title: 'Cookie Policy', desc: 'How we use cookies to improve your experience.' },
  { slug: 'security', title: 'Security', desc: 'Bank-grade security and M-Pesa integration details.' },
  { slug: 'smartgrow', title: 'SmartGrow Investments', desc: 'Put idle group funds to work with vetted investment opportunities.' }
];

const template = (title, desc) => `import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />
      
      <main className="flex-1 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-display-lg font-geist text-[#161d16] mb-6">${title}</h1>
          <p className="text-body-lg text-[#3d4a3d] mb-12">${desc}</p>
          
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
`;

pages.forEach(p => {
  const dir = path.join(__dirname, 'src', 'app', p.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), template(p.title, p.desc));
});

console.log('Created 9 placeholder pages.');
