import { clsx } from "clsx";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bell,
  BookOpen,
  Braces,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleAlert,
  CircleDollarSign,
  Copy,
  CreditCard,
  Database,
  Download,
  Feather,
  FileCheck2,
  FileText,
  Flag,
  Flame,
  Gavel,
  GraduationCap,
  Grid2x2,
  Hammer,
  Home,
  Image as ImageIcon,
  Inbox,
  Info,
  LayoutGrid,
  LifeBuoy,
  Link2,
  ListChecks,
  Lock,
  LockOpen,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Monitor,
  Network,
  Info as InfoIcon,
  Languages,
  Cpu,
  Play,
  PlayCircle,
  Plus,
  Presentation,
  Printer,
  Radio,
  Receipt,
  Route,
  Save,
  Scale,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Store,
  Radar,
  Smartphone,
  Terminal,
  Timer,
  TrendingUp,
  Trophy,
  Tv,
  UploadCloud,
  Users,
  UserCircle,
  Video,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * One place naming every icon glyph the app uses, so a typo fails at compile
 * time instead of rendering nothing at runtime.
 *
 * The names are the ones the app has always used; what changed underneath is
 * the icon set. This was Google's Material Symbols, delivered as a webfont from
 * a render-blocking `<link>` in the root layout. The design system standardises
 * on **Lucide** — geometric line icons, uniform stroke, round caps, never a
 * filled set and never mixed weights on one screen — so the same API is now
 * backed by tree-shaken SVG components. No network request, no flash of glyph
 * names while the font loads, and a set that actually matches the brand.
 *
 * Keeping the old names means every call site was left alone; the whole app
 * changed register in one file. Some names read a little oddly against their
 * Lucide equivalent (`workspace_premium` is a trophy) — that is deliberate, and
 * cheaper than renaming 300 usages.
 */
const ICONS = {
  school: GraduationCap,
  home: Home,
  account_circle: UserCircle,
  logout: LogOut,
  menu: Menu,
  close: X,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  north_east: ArrowUpRight,
  event: Calendar,
  calendar_month: CalendarDays,
  videocam: Video,
  local_fire_department: Flame,
  bolt: Zap,
  check_circle: CheckCircle2,
  cancel: X,
  schedule: Timer,
  description: FileText,
  quiz: MessageCircle,
  code: Braces,
  military_tech: Award,
  workspace_premium: Trophy,
  cloud_upload: UploadCloud,
  credit_card: CreditCard,
  receipt_long: Receipt,
  group: Users,
  insights: TrendingUp,
  add_task: Plus,
  link: Link2,
  lock: Lock,
  lock_open: LockOpen,
  language: Languages,
  grade: Star,
  auto_stories: BookOpen,
  chat: MessageCircle,
  family_restroom: LifeBuoy,
  smartphone: Smartphone,
  download: Download,
  timer: Timer,
  mail: Mail,
  send: Send,
  play_circle: PlayCircle,
  play_arrow: Play,
  notifications_active: Bell,
  search: Search,
  content_copy: Copy,
  filter_list: ListChecks,
  inbox: Inbox,
  priority_high: CircleAlert,
  computer: Monitor,
  memory: Cpu,
  settings: Settings,
  hub: Network,
  account_tree: Route,
  storage: Database,
  terminal: Terminal,
  sensors: Radar,
  storefront: Store,
  auto_awesome: Sparkles,
  assignment: FileCheck2,
  expand_more: ChevronDown,
  unfold_more: ChevronsUpDown,
  unfold_less: ChevronsDownUp,
  grid_view: Grid2x2,
  route: Route,
  flag: Flag,
  live_tv: Tv,
  co_present: Presentation,
  manage_search: Radar,
  edit_note: Feather,
  fact_check: BadgeCheck,
  work: Hammer,
  save: Save,
  image: ImageIcon,
  payments: Wallet,
  account_balance: Building2,
  rule: Scale,
  print: Printer,
  gavel: Gavel,
  info: Info,
  dashboard: LayoutGrid,
  people: Users,
  money: CircleDollarSign,
  activity: Activity,
  radio: Radio,
  done: Check,
  help: InfoIcon,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/**
 * Renders at `1em`, so size still comes from the surrounding font size exactly
 * as it did with the icon font — `className="!text-base"` and friends keep
 * working. Stroke is 1.75 at small sizes and 2 above, per the system.
 */
export function Icon({
  name,
  className,
  strokeWidth = 1.9,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      aria-hidden
      width="1em"
      height="1em"
      strokeWidth={strokeWidth}
      className={clsx("inline-block shrink-0 text-xl", className)}
    />
  );
}
