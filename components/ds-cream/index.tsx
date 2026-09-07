import Link from "next/link";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * ICTCAMPUS design-system primitives — the **cream world**.
 *
 * The dark counterpart (`components/ds/`) is what everything behind sign-in
 * is built from; this is the same system, same tokens, same component
 * shapes, skinned for the public marketing/content pages instead — white
 * cards on a warm cream ground, near-black text, the same rationed orange.
 * A page written against one of these two files should feel like the same
 * product as a page written against the other, because it's the same rules:
 *
 *   - **Pills for actions, soft-squares for containers.** Buttons, chips, tabs
 *     and avatars are `rounded-full`; cards and panels are 14/20/28px.
 *   - **No gradient fills.** Flat orange, flat ink.
 *   - **Orange is rationed** — one orange thing per region.
 *   - **Semantic colour is a 6px dot or a thin badge**, never a large fill.
 *   - **Sentence case everywhere** except `Eyebrow`.
 *
 * The one deliberate inversion: where the dark system's single "feature"
 * surface per screen is a cocoa banner, the cream world's is a near-black
 * panel (`Card variant="dark"`) — see the homepage's "What you get" section
 * for the reference. Both are the same idea: one surface per screen that
 * steps outside the base palette to carry the most important thing on it.
 */

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ArrowDir = "right" | "up-right" | "down" | "none";

const BUTTON_SIZE: Record<ButtonSize, { shell: string; badge: string; text: string }> = {
  sm: { shell: "h-8 pl-3.5 text-sm", badge: "size-5", text: "text-sm" },
  md: { shell: "h-10 pl-5 text-sm", badge: "size-[26px]", text: "text-sm" },
  lg: { shell: "h-12 pl-6 text-base", badge: "size-8", text: "text-base" },
};

const BUTTON_SKIN: Record<ButtonVariant, string> = {
  primary: "bg-ict-orange-500 text-white shadow-ict-brand hover:bg-ict-orange-600 disabled:opacity-45",
  secondary: "bg-ict-ink-900 text-white hover:bg-ict-ink-700 disabled:opacity-45",
  outline:
    "bg-transparent text-ict-ink-900 border-[1.5px] border-ict-ink-900 hover:border-ict-orange-500 hover:text-ict-orange-600 disabled:opacity-45",
  ghost: "bg-transparent text-ict-ink-900 hover:bg-ict-paper-200 disabled:opacity-45",
};

const BADGE_SKIN: Record<ButtonVariant, string> = {
  primary: "bg-white text-ict-orange-500",
  secondary: "bg-ict-orange-500 text-white",
  outline: "border border-current text-current",
  ghost: "border border-current text-current",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, arrow: ArrowDir, className?: string) {
  const s = BUTTON_SIZE[size];
  return clsx(
    "ict-press inline-flex items-center gap-2.5 whitespace-nowrap rounded-full font-semibold tracking-[-0.005em]",
    "transition-[background-color,box-shadow,transform,border-color,color] duration-[120ms] ease-ict",
    "disabled:cursor-not-allowed",
    s.shell,
    arrow === "none" ? (size === "sm" ? "pr-3.5" : size === "lg" ? "pr-6" : "pr-5") : "pr-1.5",
    BUTTON_SKIN[variant],
    className,
  );
}

function ArrowBadge({ variant, size, dir }: { variant: ButtonVariant; size: ButtonSize; dir: ArrowDir }) {
  if (dir === "none") return null;
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-full", BUTTON_SIZE[size].badge, BADGE_SKIN[variant])}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={clsx("size-[0.85em]", dir === "up-right" && "-rotate-45", dir === "down" && "rotate-90")}
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = "right",
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: ArrowDir;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button type="button" className={buttonClasses(variant, size, arrow, className)} {...rest}>
      <span>{children}</span>
      <ArrowBadge variant={variant} size={size} dir={arrow} />
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = "right",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: ArrowDir;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, arrow, className)} {...rest}>
      <span>{children}</span>
      <ArrowBadge variant={variant} size={size} dir={arrow} />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

type CardVariant = "paper" | "raised" | "dark" | "brand";

const CARD_SKIN: Record<CardVariant, string> = {
  /** The default: a white card on the cream ground. */
  paper: "bg-ict-paper-0 border border-ict-paper-300 shadow-ict-sm",
  /** One step up from the page — nested panels, rows inside a card. */
  raised: "bg-ict-paper-50 border border-ict-paper-300",
  /** Near-black frame. The system's one permitted "feature" surface per screen. */
  dark: "bg-ict-ink-900 text-ict-paper-50",
  /** Solid orange. Rationed — an upsell or a single decisive call to action. */
  brand: "bg-ict-orange-500 text-white",
};

export function Card({
  variant = "paper",
  radius = "card",
  hoverable,
  className,
  children,
  ...rest
}: {
  variant?: CardVariant;
  radius?: "md" | "card" | "panel";
  hoverable?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div
      className={clsx(
        // Grid/flex items default to `min-width: auto`, which for a card
        // containing a `truncate` label resolves to that label's full,
        // unwrapped text width — so the card refuses to shrink to its track
        // and a two-up grid of these overflows the viewport on a phone.
        // `min-w-0` lets it shrink and truncate instead; harmless in normal
        // flow, where block boxes already shrink to their container.
        "min-w-0",
        { md: "rounded-ict-md", card: "rounded-ict-card", panel: "rounded-ict-panel" }[radius],
        CARD_SKIN[variant],
        hoverable && "ict-lift hover:shadow-ict-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A card that is entirely a link — the whole surface is the hit area. */
export function CardLink({
  href,
  variant = "paper",
  radius = "card",
  className,
  children,
}: {
  href: string;
  variant?: CardVariant;
  radius?: "md" | "card" | "panel";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        // See the matching comment on `Card` above — same grid/flex shrink fix.
        "block min-w-0 ict-lift hover:shadow-ict-md",
        { md: "rounded-ict-md", card: "rounded-ict-card", panel: "rounded-ict-panel" }[radius],
        CARD_SKIN[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Type                                                                        */
/* -------------------------------------------------------------------------- */

/** The only uppercase text in the system: 12px, 0.14em tracking, orange. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx("ict-eyebrow", className)}>{children}</p>;
}

/**
 * A section headline, optionally closed by the brand's orange full stop.
 * Capped at once per screen — see `components/ds/index.tsx`'s own note.
 */
export function SectionHeading({
  children,
  period = false,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  period?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={clsx("font-display text-xl font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-2xl", className)}>
      {children}
      {period ? <span className="text-ict-orange-500">.</span> : null}
    </Tag>
  );
}

/** Standard page header for a content page. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  period = false,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  period?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900 sm:text-[30px]">
          {title}
          {period ? <span className="text-ict-orange-500">.</span> : null}
        </h1>
        {subtitle ? <p className="mt-1.5 text-sm text-ict-ink-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export type StatusTone = "success" | "warning" | "danger" | "info" | "event" | "brand" | "neutral";

const DOT_COLOR: Record<StatusTone, string> = {
  success: "bg-ict-green-500",
  warning: "bg-ict-amber-500",
  danger: "bg-ict-red-500",
  info: "bg-ict-blue-500",
  event: "bg-ict-violet-500",
  brand: "bg-ict-orange-500",
  neutral: "bg-ict-ink-300",
};

/** Status is a dot, not an icon — the ONLY way semantic hues enter the UI. */
export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return <span aria-hidden className={clsx("size-1.5 shrink-0 rounded-full", DOT_COLOR[tone], className)} />;
}

/** Dot plus label in a pill. */
export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full bg-ict-paper-200 px-2.5 text-xs font-semibold text-ict-ink-900",
        className,
      )}
    >
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

/** A thin badge for a count or a single word. Tinted, never saturated. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const skin: Record<StatusTone, string> = {
    success: "bg-ict-green-50 text-ict-green-500",
    warning: "bg-ict-amber-50 text-[#a1670f]",
    danger: "bg-ict-red-50 text-ict-red-500",
    info: "bg-ict-blue-50 text-ict-blue-500",
    event: "bg-ict-violet-50 text-ict-violet-500",
    brand: "bg-ict-orange-50 text-ict-orange-600",
    neutral: "bg-ict-paper-200 text-ict-ink-500",
  };
  return (
    <span
      className={clsx(
        "inline-flex h-[22px] items-center rounded-full px-2.5 text-xs font-bold uppercase tracking-[0.02em]",
        skin[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A neutral pill for filters, counts and metadata. */
export function Chip({
  icon,
  children,
  active,
  className,
}: {
  icon?: IconName;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        active ? "bg-ict-orange-500 text-white" : "bg-ict-paper-200 text-ict-ink-900",
        className,
      )}
    >
      {icon ? <Icon name={icon} className={clsx("!text-sm", active ? "" : "text-ict-orange-500")} /> : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

/** The brand's icon container: a soft-square (or circle) holding a line glyph. */
export function IconBadge({
  icon,
  tone = "soft",
  size = 44,
  round,
  done,
  className,
}: {
  icon: IconName;
  tone?: "soft" | "dark" | "brand" | "tile";
  size?: number;
  round?: boolean;
  done?: boolean;
  className?: string;
}) {
  const skin = {
    soft: "bg-ict-orange-50 text-ict-orange-500",
    dark: "bg-ict-ink-900 text-ict-paper-50",
    brand: "bg-ict-orange-500 text-white",
    tile: "bg-white text-ict-ink-900",
  }[tone];

  return (
    <span
      style={{ width: size, height: size }}
      className={clsx("relative grid shrink-0 place-items-center", round ? "rounded-full" : "rounded-ict-md", skin, className)}
    >
      <Icon name={icon} className="!text-[1.1rem]" />
      {done ? (
        <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full border-2 border-ict-paper-0 bg-ict-orange-500">
          <Icon name="done" className="!text-[8px] text-white" strokeWidth={4} />
        </span>
      ) : null}
    </span>
  );
}

/** 6px pill track, orange fill, percentage to the right. */
export function ProgressBar({
  value,
  showLabel = true,
  className,
}: {
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ict-paper-300">
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-ict-orange-500 transition-[width] duration-[340ms] ease-ict-out"
        />
      </div>
      {showLabel ? <span className="text-sm font-semibold tabular-nums text-ict-ink-900">{pct}%</span> : null}
    </div>
  );
}

/** A metric on a card: label, big number, optional hint. */
export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatusTone;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <Icon name={icon} className={clsx("!text-base", tone === "neutral" ? "text-ict-ink-400" : "text-ict-orange-500")} />
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-ict-ink-400">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">{value}</p>
      {hint ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ict-ink-400">
          {tone !== "neutral" ? <StatusDot tone={tone} /> : null}
          {hint}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <CardLink href={href} radius="md" className="p-4">
        {body}
      </CardLink>
    );
  }
  return (
    <Card radius="md" className="p-4">
      {body}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

/** Say what is missing and what to do about it, in one sentence. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card radius="card" className="flex flex-col items-center px-6 py-10 text-center">
      <IconBadge icon={icon} tone="soft" size={48} />
      <p className="mt-4 font-display text-base font-bold text-ict-ink-900">{title}</p>
      {body ? <p className="mt-1.5 max-w-sm text-sm text-ict-ink-400">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

/** Section label above a group of cards, with an optional link on the right. */
export function SectionBar({
  title,
  hint,
  href,
  linkLabel = "See all",
}: {
  title: string;
  hint?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <SectionHeading as="h2" className="!text-lg">
          {title}
        </SectionHeading>
        {hint ? <p className="mt-0.5 text-sm text-ict-ink-400">{hint}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-ict-ink-400 transition-colors duration-[120ms] hover:text-ict-orange-600"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
