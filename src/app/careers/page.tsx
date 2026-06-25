import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Careers | SmartChama",
  description: "Help us rebuild community finance in Africa. We are a small team doing important work.",
};

export default function CareersPage() {
  const jobs = [
    {
      badge: "ENGINEERING",
      badgeColors: "bg-[#22C55E]/10 text-[#005321]",
      title: "Full Stack Engineer",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "We are looking for a full stack engineer with strong experience in Next.js, TypeScript, and PostgreSQL. You will work on our core platform, building features that are used by thousands of savings groups across Kenya.",
      respTitle: "You will be responsible for:",
      responsibilities: [
        "Building and maintaining member and admin dashboard features",
        "Integrating with M-Pesa Daraja API",
        "Writing clean, tested, maintainable code",
        "Participating in product discussions and helping define what we build next"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "2 or more years of experience with React and Next.js",
        "Strong TypeScript skills",
        "Experience with PostgreSQL or Supabase",
        "Understanding of RESTful APIs",
        "Interest in fintech or financial inclusion"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Full Stack Engineer"
    },
    {
      badge: "ENGINEERING",
      badgeColors: "bg-[#22C55E]/10 text-[#005321]",
      title: "Mobile Engineer (React Native)",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "We are building a mobile application for SmartChama. Members need to access their group, make contributions, and check their trust score from their phone. You will own this product.",
      respTitle: "Responsibilities:",
      responsibilities: [
        "Build and maintain the SmartChama mobile app using React Native",
        "Integrate with M-Pesa and our Supabase backend",
        "Ensure the app works on low-end Android devices common in Kenya",
        "Work closely with design to deliver a premium mobile experience"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "Experience with React Native",
        "Understanding of mobile performance on low-bandwidth networks",
        "Experience with payment integrations is a strong advantage"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Mobile Engineer"
    },
    {
      badge: "PRODUCT",
      badgeColors: "bg-blue-50 text-blue-700",
      title: "Product Designer",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "SmartChama needs to feel premium and trustworthy. You will own the entire design system and user experience across web and mobile.",
      respTitle: "Responsibilities:",
      responsibilities: [
        "Design features from concept to production-ready specifications",
        "Maintain and evolve our design system",
        "Conduct user research with chama members and group administrators",
        "Work directly with engineers to ensure design is implemented correctly"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "Strong portfolio showing fintech or financial product design",
        "Proficiency in Figma",
        "Understanding of mobile-first design",
        "Ability to design for users with varying levels of digital literacy"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Product Designer"
    },
    {
      badge: "GROWTH",
      badgeColors: "bg-purple-50 text-purple-700",
      title: "Community Growth Manager",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "We grow through trust. Our best marketing is a chama chairlady who tells her network about SmartChama. You will own this community-led growth motion.",
      respTitle: "Responsibilities:",
      responsibilities: [
        "Build relationships with chama leaders across Nairobi and beyond",
        "Run onboarding workshops for new groups",
        "Develop content that educates groups on digital financial management",
        "Track group activation and retention metrics"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "Deep understanding of Kenya's chama culture",
        "Strong communication and relationship-building skills",
        "Experience in community management, field sales, or financial services"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Community Growth Manager"
    },
    {
      badge: "FINANCE",
      badgeColors: "bg-orange-50 text-orange-700",
      title: "Finance and Compliance Officer",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "As we grow, we need someone who understands Kenya's financial regulations and can ensure SmartChama operates within them.",
      respTitle: "Responsibilities:",
      responsibilities: [
        "Monitor regulatory developments from CBK and other bodies",
        "Develop and maintain compliance documentation",
        "Liaise with legal counsel on product decisions",
        "Support audit processes"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "Background in finance, law, or compliance",
        "Knowledge of CBK regulations and fintech licensing in Kenya",
        "Detail-oriented and systematic"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Finance and Compliance Officer"
    },
    {
      badge: "SUPPORT",
      badgeColors: "bg-teal-50 text-teal-700",
      title: "Customer Success Agent",
      location: "Nairobi, Kenya",
      type: "Full-time",
      descIntro: "Our users are real people managing real money. When they have a problem, they need fast, clear, human support. You will be the voice of SmartChama.",
      respTitle: "Responsibilities:",
      responsibilities: [
        "Respond to member and admin queries via WhatsApp, email, and in-app chat",
        "Escalate technical issues to the engineering team",
        "Document common issues and help build our knowledge base",
        "Conduct follow-up calls with new groups in their first 30 days"
      ],
      reqTitle: "What we are looking for:",
      requirements: [
        "Excellent written and spoken communication in English and Swahili",
        "Patient and empathetic problem-solving approach",
        "Interest in financial technology"
      ],
      applyLink: "mailto:careers@smartchama.co.ke?subject=Application: Customer Success Agent"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="bg-[#0B0F0C] py-24 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-label-caps text-[#22C55E] tracking-widest mb-6">JOIN THE TEAM</div>
          <h1 className="text-display-lg font-geist font-bold text-white mb-6 leading-tight">
            Help us rebuild<br className="hidden md:block" />
            community finance in Africa.
          </h1>
          <p className="text-body-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            We are a small team doing important work. If you are passionate about financial inclusion, technology, and building products that genuinely change lives, you are in the right place.
          </p>
        </div>
      </section>

      {/* WHY WORK HERE */}
      <section className="bg-white py-24 px-6 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-16 text-center">Why SmartChama</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Meaningful work</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                Every line of code you write helps a real person manage their savings, access a loan, or prove their financial identity for the first time. That is not a small thing.
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Small team, big responsibility</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                We are not a corporation. Every person on the team owns their work completely. You will ship features, talk to users, and make decisions that matter.
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Built in Nairobi</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                We work from Nairobi. We understand the local context. We move at startup pace and we celebrate wins together.
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-8">
              <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4">Competitive compensation</h3>
              <p className="text-body-lg text-[#3d4a3d] leading-relaxed">
                We offer competitive salaries, equity options, flexible working arrangements, and a genuine commitment to your professional growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS */}
      <section className="bg-[#edf6ea] py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-[36px] font-geist font-bold text-[#161d16] mb-4">Open positions</h2>
            <p className="text-[18px] text-[#3d4a3d]">
              We are currently hiring for these roles. Do not see your role? Send us your CV anyway at <a href="mailto:careers@smartchama.co.ke" className="text-[#006e2f] hover:underline">careers@smartchama.co.ke</a>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {jobs.map((job, idx) => (
              <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-8 flex flex-col h-full">
                <div className="mb-6">
                  <span className={`inline-block px-3 py-1 rounded text-label-caps font-bold tracking-wider mb-4 ${job.badgeColors}`}>
                    {job.badge}
                  </span>
                  <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-2">{job.title}</h3>
                  <div className="flex gap-4 text-body-sm text-[#60645f]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {job.type}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-6 text-body-sm text-[#3d4a3d]">
                  <p className="leading-relaxed">{job.descIntro}</p>

                  <div>
                    <h4 className="font-bold text-[#161d16] mb-2">{job.respTitle}</h4>
                    <ul className="space-y-2">
                      {job.responsibilities.map((r, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="material-symbols-outlined text-[#006e2f] text-[16px] shrink-0 mt-0.5">check</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#161d16] mb-2">{job.reqTitle}</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((r, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="material-symbols-outlined text-[#006e2f] text-[16px] shrink-0 mt-0.5">check</span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                  <a href={job.applyLink} className="inline-block bg-[#22C55E] hover:bg-[#006e2f] transition-colors text-white font-medium px-6 py-3 rounded text-center">
                    Apply for this role
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION */}
      <section className="bg-[#0B0F0C] py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[32px] font-geist font-bold text-white mb-6 leading-tight">Do not see your role?</h2>
          <p className="text-[18px] text-gray-400 opacity-90 leading-relaxed">
            We are always interested in exceptional people. Send your CV and a short note about why you want to work on community finance to <a href="mailto:careers@smartchama.co.ke" className="text-[#22C55E] hover:underline">careers@smartchama.co.ke</a>
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
