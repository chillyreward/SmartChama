import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Blog | SmartChama",
  description: "Insights on community finance, savings culture, and financial inclusion across Kenya and Africa.",
};

export default function BlogPage() {
  const articles = [
    {
      category: "SAVINGS",
      date: "May 2025",
      title: "How to run a chama that lasts more than two years",
      preview: "Most chamas dissolve within 18 months. The reasons are almost always the same: poor record keeping, disputes over loan repayments, and lack of clear rules. Here is what successful groups do differently...",
      link: "#"
    },
    {
      category: "LOANS",
      date: "April 2025",
      title: "Setting fair interest rates for internal chama loans",
      preview: "One of the most common sources of conflict in savings groups is loan interest. Charge too little and the group loses value. Charge too much and members resent the system. Here is how to find the right rate...",
      link: "#"
    },
    {
      category: "TECHNOLOGY",
      date: "March 2025",
      title: "M-Pesa and the future of community savings",
      preview: "When M-Pesa launched in 2007, it changed how Kenya moves money. Today, it is changing how Kenya saves together. Here is how mobile money is transforming the chama model...",
      link: "#"
    },
    {
      category: "FINANCIAL IDENTITY",
      date: "February 2025",
      title: "What is a CREDIT SCORE and why does it matter?",
      preview: "Your SmartChama CREDIT SCORE is a number between 0 and 100 that represents your financial reliability within your group. But it is more than just a number. It is the beginning of a financial identity...",
      link: "#"
    },
    {
      category: "GUIDE",
      date: "January 2025",
      title: "How to start a chama from scratch in 2025",
      preview: "Starting a savings group is simple in theory and complicated in practice. Who sets the rules? How much should each member contribute? What happens when someone defaults? This guide answers all of it...",
      link: "#"
    },
    {
      category: "SMARTGROW",
      date: "December 2024",
      title: "Where should your chama invest its idle funds?",
      preview: "Most savings groups keep their money in a mobile wallet earning nothing. But there are regulated, low-risk investment options available to Kenyan groups that most chairladies do not know about...",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />

      {/* HERO */}
      <section className="bg-white border-b border-[#E5E7EB] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center md:text-left">
          <h1 className="text-[48px] font-geist font-bold text-[#161d16] mb-4">SmartChama Blog</h1>
          <p className="text-[18px] text-[#60645f] max-w-2xl">
            Insights on community finance, savings culture, and financial inclusion across Kenya and Africa.
          </p>
        </div>
      </section>

      {/* FEATURED ARTICLE */}
      <section className="bg-[#edf6ea] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-[#22C55E]/10 text-[#005321] text-label-caps font-bold px-3 py-1 rounded tracking-wider">
                FINANCIAL INCLUSION
              </span>
              <span className="text-body-sm text-[#60645f]">June 2025</span>
            </div>
            
            <h2 className="text-[32px] font-geist font-bold text-[#161d16] mb-6 leading-tight">
              Why your chama contribution record is more valuable than you think
            </h2>
            
            <div className="space-y-6 text-[18px] font-inter text-[#3d4a3d] leading-relaxed mb-8">
              <p>
                Most chama members do not realise what they are building. Every month, when you send that M-Pesa payment, you are not just saving money. You are demonstrating financial discipline in a way that no bank account statement can match.
              </p>
              <p>
                A savings account shows a balance. A chama record shows behaviour. It shows that you showed up month after month, that you kept your commitment to your group even when times were difficult, and that your word means something.
              </p>
              <p>
                This is why SmartChama was built. Not to replace the chama, but to make its record visible, verifiable, and useful beyond the group itself.
              </p>
            </div>

            <Link href="#" className="inline-flex items-center gap-2 text-[#006e2f] font-semibold hover:underline">
              Read full article <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ARTICLES GRID */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[28px] font-geist font-bold text-[#161d16] mb-10">All articles</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:border-[#006e2f] transition-colors flex flex-col h-full group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-caps text-[#60645f] font-bold tracking-wider uppercase">
                    {article.category}
                  </span>
                  <span className="text-body-sm text-[#60645f]">{article.date}</span>
                </div>
                
                <h3 className="text-headline-sm font-geist font-bold text-[#161d16] mb-4 leading-tight group-hover:text-[#006e2f] transition-colors">
                  <Link href={article.link}>
                    {article.title}
                  </Link>
                </h3>
                
                <p className="text-body-sm text-[#3d4a3d] leading-relaxed mb-6 flex-1">
                  {article.preview}
                </p>
                
                <Link href={article.link} className="inline-flex items-center gap-1 text-[#006e2f] font-medium hover:underline mt-auto">
                  Read more <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-[#0B0F0C] py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[32px] font-geist font-bold text-white mb-4">Get new articles by email</h2>
          <p className="text-[18px] text-gray-400 mb-8 leading-relaxed">
            We write about community finance, savings culture, and financial inclusion. No spam. Unsubscribe any time.
          </p>
          
          <form className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input 
              type="email" 
              required
              placeholder="your@email.com" 
              className="bg-white text-[#161d16] rounded px-4 py-3 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#006e2f] border-none"
            />
            <button 
              type="submit" 
              className="bg-[#006e2f] hover:bg-[#005321] transition-colors text-white px-6 py-3 rounded font-medium w-full sm:w-auto"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
