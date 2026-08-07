import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Cookie Policy | SmartChama",
  description: "Cookie Policy for using the SmartChama platform.",
};

export default function CookiePage() {
  const sections = [
    {
      title: "1. What are cookies",
      content: (
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the website remember information about your visit.
        </p>
      )
    },
    {
      title: "2. Cookies we use",
      content: (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse text-left border border-[#E5E7EB]">
            <thead className="bg-[#FAFAFA]">
              <tr>
                <th className="border-b border-[#E5E7EB] p-4 text-[var(--text-primary)] font-bold">Name</th>
                <th className="border-b border-[#E5E7EB] p-4 text-[var(--text-primary)] font-bold">Purpose</th>
                <th className="border-b border-[#E5E7EB] p-4 text-[var(--text-primary)] font-bold">Duration</th>
                <th className="border-b border-[#E5E7EB] p-4 text-[var(--text-primary)] font-bold">Can you opt out</th>
              </tr>
            </thead>
            <tbody className="text-[#3d4a3d]">
              <tr>
                <td className="border-b border-[#E5E7EB] p-4 font-mono text-sm">session_token</td>
                <td className="border-b border-[#E5E7EB] p-4">Keeps you logged in</td>
                <td className="border-b border-[#E5E7EB] p-4">Session</td>
                <td className="border-b border-[#E5E7EB] p-4 font-bold text-[#006e2f]">No, essential</td>
              </tr>
              <tr>
                <td className="border-b border-[#E5E7EB] p-4 font-mono text-sm">preferences</td>
                <td className="border-b border-[#E5E7EB] p-4">Remembers your settings</td>
                <td className="border-b border-[#E5E7EB] p-4">1 year</td>
                <td className="border-b border-[#E5E7EB] p-4 font-bold text-[#006e2f]">No, essential</td>
              </tr>
              <tr>
                <td className="border-b border-[#E5E7EB] p-4 font-mono text-sm">analytics</td>
                <td className="border-b border-[#E5E7EB] p-4">Understands how platform is used</td>
                <td className="border-b border-[#E5E7EB] p-4">90 days</td>
                <td className="border-b border-[#E5E7EB] p-4">Yes</td>
              </tr>
              <tr>
                <td className="border-b border-[#E5E7EB] p-4 font-mono text-sm">marketing</td>
                <td className="border-b border-[#E5E7EB] p-4">Not currently used</td>
                <td className="border-b border-[#E5E7EB] p-4">N/A</td>
                <td className="border-b border-[#E5E7EB] p-4">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "3. Essential cookies",
      content: (
        <p>
          These cookies are required for SmartChama to function. Without them you cannot log in or use the platform. They cannot be disabled.
        </p>
      )
    },
    {
      title: "4. Analytics cookies",
      content: (
        <p>
          We use analytics to understand which features members use most, where people have difficulty, and how to improve the platform. Analytics data is anonymised and not linked to your identity. You can opt out in your browser settings.
        </p>
      )
    },
    {
      title: "5. Managing cookies",
      content: (
        <>
          <p className="mb-4">
            You can control cookies through your browser settings. Instructions:
          </p>
          <ul className="list-disc pl-5 space-y-2 my-4 text-[#3d4a3d]">
            <li><strong>Chrome:</strong> Settings, Privacy and Security, Cookies</li>
            <li><strong>Safari:</strong> Settings, Safari, Privacy</li>
            <li><strong>Firefox:</strong> Settings, Privacy and Security</li>
          </ul>
          <p>
            Note that disabling essential cookies will prevent you from using SmartChama.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-inter text-on-surface">
      <LandingNav />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[40px] font-geist font-bold text-[var(--text-primary)] mb-2">Cookie Policy</h1>
          <p className="text-body-sm text-[#60645f] mb-10">Last updated: June 2025</p>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-[24px] font-geist font-bold text-[var(--text-primary)] mb-4">
                  {section.title}
                </h2>
                <div className="text-[16px] text-[#3d4a3d] leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
