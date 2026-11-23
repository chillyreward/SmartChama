import {
  Home, Coins, PiggyBank, Wallet, ReceiptText, RefreshCw, HeartHandshake, AlertCircle, Sprout, Users,
  MessageCircle, ShieldCheck, LineChart, Bell, Settings, LifeBuoy, Megaphone, ScrollText, ScanSearch,
  UserRound, type LucideIcon,
} from 'lucide-react';

export type NavItem = { name: string; href: string; icon: LucideIcon };
export type NavGroup = { title: string; items: NavItem[] };

export const OFFICIAL_ROLES = ['admin', 'chairlady', 'treasurer', 'secretary'];

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Group admin',
  chairlady: 'Chair',
  treasurer: 'Treasurer',
  secretary: 'Secretary',
  member: 'Member',
};

export const MEMBER_NAV: NavGroup[] = [
  {
    title: 'Your money',
    items: [
      { name: 'Overview', href: '/dashboard', icon: Home },
      { name: 'Contributions', href: '/dashboard/contributions', icon: Coins },
      { name: 'Savings', href: '/dashboard/savings', icon: PiggyBank },
      { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
      { name: 'Transactions', href: '/dashboard/transactions', icon: ReceiptText },
    ],
  },
  {
    title: 'The group',
    items: [
      { name: 'Merry-go-round', href: '/dashboard/merry-go-round', icon: RefreshCw },
      { name: 'Welfare fund', href: '/dashboard/welfare', icon: HeartHandshake },
      { name: 'SmartGrow', href: '/dashboard/smartgrow', icon: Sprout },
      { name: 'Penalties', href: '/dashboard/penalties', icon: AlertCircle },
      { name: 'Members', href: '/dashboard/members', icon: Users },
      { name: 'Group chat', href: '/dashboard/chat', icon: MessageCircle },
    ],
  },
  {
    title: 'You',
    items: [
      { name: 'Trust score', href: '/dashboard/trust-score', icon: ShieldCheck },
      { name: 'Your progress', href: '/dashboard/analytics', icon: LineChart },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'Help', href: '/dashboard/support', icon: LifeBuoy },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Running the group',
    items: [
      { name: 'Overview', href: '/admin/dashboard', icon: Home },
      { name: 'Members', href: '/admin/members', icon: Users },
      { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    title: 'Money',
    items: [
      { name: 'Contributions', href: '/admin/contributions', icon: Coins },
      { name: 'Wallet and withdrawals', href: '/admin/wallet', icon: Wallet },
      { name: 'Transactions', href: '/admin/transactions', icon: ReceiptText },
      { name: 'Penalties', href: '/admin/penalties', icon: AlertCircle },
    ],
  },
  {
    title: 'Programmes',
    items: [
      { name: 'Merry-go-round', href: '/admin/merry-go-round', icon: RefreshCw },
      { name: 'Welfare fund', href: '/admin/welfare', icon: HeartHandshake },
      { name: 'SmartGrow', href: '/admin/smartgrow', icon: Sprout },
    ],
  },
  {
    title: 'Oversight',
    items: [
      { name: 'Trust scores', href: '/admin/trust-scores', icon: ShieldCheck },
      { name: 'Analytics', href: '/admin/analytics', icon: LineChart },
      { name: 'Fraud checks', href: '/admin/fraud', icon: ScanSearch },
      { name: 'Audit log', href: '/admin/audit-log', icon: ScrollText },
      { name: 'Group settings', href: '/admin/settings', icon: Settings },
      { name: 'Your profile', href: '/admin/profile', icon: UserRound },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/admin/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}
