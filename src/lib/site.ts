// One place for public facts about Akibora. Keep every line here true.
// Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel once the team has a real inbox.
export const SITE = {
  name: 'Akibora',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://smartchama.vercel.app',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@akibora.co.ke',
  // Where things honestly stand. Used by the landing page, About and Careers.
  stage: 'early-access' as const,
  hackathon: 'Built for a hackathon, which the team won. Now being turned into a product.',
};

export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    per: '',
    blurb: 'For small family chamas getting started.',
    features: ['Up to 10 members', 'Contributions logged by officials', 'Ledger export to PDF'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'KSh 500',
    per: 'a month',
    blurb: 'For active chamas that collect on M-Pesa.',
    features: ['Unlimited members', 'M-Pesa payment prompts', 'SMS and push reminders', 'Merry-go-round and welfare fund'],
    featured: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'KSh 2,500',
    per: 'a month',
    blurb: 'For investment groups growing their pot.',
    features: ['Everything in Pro', 'SmartGrow investment votes', 'Fraud checks on every payment', 'Priority support'],
  },
] as const;
