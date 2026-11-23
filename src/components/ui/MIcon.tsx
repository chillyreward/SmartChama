import {
  ChevronRight, ChevronLeft, CheckCircle2, X, Sparkles, AlertCircle, Download, AlertTriangle, BadgeCheck, Search, Flag, Plus,
  Sheet, FileText, Phone, Banknote, Info, Users, ArrowLeft, TrendingUp, ShieldCheck, Shield, Send, Radar, UserPlus, Mail, Lightbulb,
  Hourglass, LifeBuoy, MessageCircle, Megaphone, CalendarDays, BarChart3, ArrowUp, ArrowDown, Eye, EyeOff, Activity, ArrowLeftRight,
  Star, MessageSquare, LineChart, Clock, PiggyBank, RefreshCw, ReceiptText, HelpCircle, QrCode, BellRing, Medal, UserCog, LockOpen,
  Flame, Share, UserCheck, History, Siren, Pencil, MonitorSmartphone, Trash2, Copy, Construction, Check, Zap, ArrowUpRight, ArrowRight,
  Home, Wallet, Bell, Settings, LogOut, Heart, Lock, User, Circle, Calendar, Smartphone, Gavel, Scale, Vote, Landmark, CreditCard,
  Fingerprint, Camera, Upload, KeyRound, Globe, Moon, Sun, Filter, MoreHorizontal, Gift, Handshake, Coins, Target, Award, type LucideIcon,
} from 'lucide-react';
import { cn } from './index';

// Material Symbols names used by older screens, drawn with lucide so the app needs no icon font.
const MAP: Record<string, LucideIcon> = {
  chevron_right: ChevronRight, chevron_left: ChevronLeft, check_circle: CheckCircle2, close: X, smart_toy: Sparkles, auto_awesome: Sparkles,
  error_outline: AlertCircle, error: AlertCircle, download: Download, warning: AlertTriangle, verified: BadgeCheck, verified_user: ShieldCheck,
  search: Search, flag: Flag, add: Plus, table_chart: Sheet, picture_as_pdf: FileText, description: FileText, phone: Phone, payments: Banknote,
  info: Info, group: Users, groups: Users, arrow_back: ArrowLeft, trending_up: TrendingUp, shield: Shield, security: ShieldCheck, send: Send,
  radar: Radar, person_add: UserPlus, group_add: UserPlus, mail: Mail, email: Mail, lightbulb: Lightbulb, hourglass_top: Hourglass,
  hourglass_empty: Hourglass, contact_support: LifeBuoy, support_agent: LifeBuoy, chat: MessageCircle, forum: MessageCircle,
  campaign: Megaphone, calendar_today: CalendarDays, event: Calendar, bar_chart: BarChart3, arrow_upward: ArrowUp, arrow_downward: ArrowDown,
  visibility: Eye, visibility_off: EyeOff, timeline: Activity, switch_account: ArrowLeftRight, stars: Star, star: Star, sms: MessageSquare,
  show_chart: LineChart, insights: LineChart, schedule: Clock, savings: PiggyBank, refresh: RefreshCw, autorenew: RefreshCw,
  receipt_long: ReceiptText, receipt: ReceiptText, quiz: HelpCircle, help: HelpCircle, qr_code_2: QrCode, qr_code: QrCode,
  notifications_active: BellRing, notifications: Bell, military_tech: Medal, manage_accounts: UserCog, lock_open: LockOpen, lock: Lock,
  local_fire_department: Flame, ios_share: Share, share: Share, how_to_reg: UserCheck, history: History, emergency: Siren, edit: Pencil,
  devices: MonitorSmartphone, delete: Trash2, content_copy: Copy, construction: Construction, check: Check, bolt: Zap,
  arrow_outward: ArrowUpRight, arrow_forward: ArrowRight, home: Home, account_balance_wallet: Wallet, wallet: Wallet, settings: Settings,
  tune: Settings, logout: LogOut, favorite: Heart, volunteer_activism: Handshake, handshake: Handshake, person: User, account_circle: User,
  smartphone: Smartphone, phone_android: Smartphone, gavel: Gavel, balance: Scale, how_to_vote: Vote, account_balance: Landmark,
  credit_card: CreditCard, fingerprint: Fingerprint, photo_camera: Camera, upload: Upload, upload_file: Upload, key: KeyRound,
  language: Globe, dark_mode: Moon, light_mode: Sun, filter_list: Filter, more_horiz: MoreHorizontal, redeem: Gift, monetization_on: Coins,
  paid: Coins, track_changes: Target, workspace_premium: Award, gpp_bad: ShieldCheck, block: X, grid_view: MoreHorizontal,
  settings_accessibility: User, chat_bubble: MessageCircle, group_work: Users,
};

export function MIcon({ name, className, size, style }: { name?: string | null; className?: string; size?: number; style?: React.CSSProperties }) {
  const Icon = (name && MAP[name]) || Circle;
  const px = size ?? Number(/text-\[(\d+)px\]/.exec(className || '')?.[1] || 20);
  const cls = (className || '').replace(/text-\[\d+px\]/g, '').replace(/\bmaterial-symbols-outlined\b/g, '');
  return <Icon size={px} strokeWidth={1.8} aria-hidden="true" className={cn('inline-block shrink-0', cls)} style={style} />;
}
