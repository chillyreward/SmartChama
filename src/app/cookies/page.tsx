import Link from 'next/link';
import { LegalPage } from '@/components/landing/LegalPage';
import { TableWrap, tableClass } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Cookies | Akibora',
  description: 'The cookies and browser storage Akibora uses, and why.',
};

// Keep this list in step with the code: every cookie and storage key Akibora sets.
const ITEMS: [string, string, string, string][] = [
  ['sb-…-auth-token', 'Cookie', 'Keeps you signed in. Set by Supabase, our sign-in provider.', 'Until you sign out'],
  ['active_chama_id', 'Cookie', 'Which group you have open, so pages load the right one.', '30 days'],
  ['theme', 'Browser storage', 'Light or dark mode.', 'Until you clear it'],
  ['sc_last_chama_id', 'Browser storage', 'Opens the group you used last.', 'Until you clear it'],
  ['sc_pending_group', 'Browser storage', 'Holds a new group’s details while you confirm your email.', 'Removed once the group is created'],
  ['sc_pending_join_code', 'Browser storage', 'Holds a group code while you finish signing up.', 'Removed once you join'],
  ['sc_hamster_seen_v1', 'Browser storage', 'Remembers that you have seen the welcome tour.', 'Until you clear it'],
  ['ak_insight_hidden', 'Browser storage', 'Remembers that you hid a tip on your overview.', 'Until you clear it'],
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      updated="23 November 2026"
      intro={<p>Akibora only stores what it needs to keep you signed in and remember your choices. No advertising cookies, no analytics cookies, no tracking across other sites.</p>}
      sections={[
        {
          id: 'list',
          title: 'Everything we store',
          body: (
            <TableWrap>
              <table className={tableClass}>
                <thead>
                  <tr><th>Name</th><th>Where</th><th>What it does</th><th>How long</th></tr>
                </thead>
                <tbody className="text-ink">
                  {ITEMS.map(([name, where, what, howLong]) => (
                    <tr key={name}>
                      <td className="font-mono text-[13px] whitespace-nowrap">{name}</td>
                      <td className="text-ink-2 whitespace-nowrap">{where}</td>
                      <td>{what}</td>
                      <td className="text-ink-2">{howLong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ),
        },
        {
          id: 'needed',
          title: 'Why you can’t turn them off',
          body: <p>Without the sign-in cookie you can&apos;t stay signed in, and without the group cookie pages don&apos;t know which group to show. The rest only remember small choices, and clearing them is harmless.</p>,
        },
        {
          id: 'clear',
          title: 'Clearing them',
          body: (
            <>
              <p>Signing out removes the sign-in cookie. To clear everything, use your browser&apos;s settings:</p>
              <ul>
                <li><strong>Chrome:</strong> Settings, then Privacy and security, then Delete browsing data.</li>
                <li><strong>Safari on iPhone:</strong> Settings, then Apps, then Safari, then Clear History and Website Data.</li>
                <li><strong>Firefox:</strong> Settings, then Privacy and Security, then Cookies and Site Data.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'more',
          title: 'More',
          body: <p>How we handle personal data is on the <Link href="/privacy">privacy page</Link>. Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>,
        },
      ]}
    />
  );
}
