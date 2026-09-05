import Link from "next/link";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * ICTCAMPUS design-system primitives.
 *
 * These are the components from the supplied system, rebuilt as server-safe
 * React with Tailwind instead of inline styles. Everything behind sign-in is
 * built from these; reach for a raw `<div className="rounded-xl border …">`
 * only when the thing you need genuinely is not in here, and then consider
 * adding it here instead.
 *
 * The rules encoded below, so they cannot be forgotten at a call site:
 *
 *   - **Pills for actions, soft-squares for containers.** Buttons, chips, tabs,
 *     avatars and inputs are `rounded-full`; cards and panels are 14/20/28px.
 *   - **No gradient fills.** Flat orange, flat ink. The system permits gradients
 *     only as a protection scrim over photography.
 *   - **Orange is rationed** — one orange thing per region. That is a judgement
 *     the caller makes, but `Button variant="primary"` is the intended carrier.
 *   - **Semantic colour is a 6px dot or a thin badge**, never a large fill.
 *   - **Sentence case everywhere** except `Eyebrow`, which is the only
 *     uppercase text in the system.
 */

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";
type ArrowDir = "right" | "up-right" | "down" | "none";

const BUTTON_SIZE: Record<ButtonSize, { shell: string; badge: string; text: string }> = {
  sm: { shell: "h-8 pl-3.5 text-sm", badge: "size-5", text: "text-sm" },
  md: { shell: "h-10 pl-5 text-sm", badge: "size-[26px]", text: "text-sm" },
  lg: { shell: "h-12 pl-6 text-base", badge: "size-8", text: "text-base" },
};

const BUTTON_SKIN: Record<ButtonVariant, string> = {
  primary:
    "bg-ict-orange-500 text-white shadow-ict-brand hover:bg-ict-orange-600 disabled:opacity-45",
  secondary:
    "bg-ict-ink-900 text-ict-paper-50 hover:bg-ict-ink-700 disabled:opacity-45 border border-ict-border-dark",
  ghost:
    "bg-transparent text-ict-paper-50 hover:bg-ict-ink-800 disabled:opacity-45",
  outline:
    "bg-transparent text-ict-paper-50 border-[1.5px] border-ict-ink-500 hover:border-ict-ink-300 disabled:opacity-45",
};

const BADGE_SKIN: Record<ButtonVariant, string> = {
  primary: "bg-white text-ict-orange-500",
  secondary: "bg-ict-orange-500 text-white",
  ghost: "border border-current text-current",
  outline: "border border-current text-current",
};

/**
 * The signature button: a solid pill with a **circular arrow badge** on the
 * right, the badge inverted against the fill. `right` advances within a flow,
 * `up-right` opens something new or external — the direction is meaning, not
 * decoration, so pick it deliberately.
 */
function buttonClasses(variant: ButtonVariant, size: ButtonSize, arrow: ArrowDir, className?: string) {
  const s = BUTTON_SIZE[size];
  return clsx(
    // A pill that wraps is not a pill: the fill breaks across two lines and the
    // arrow badge falls out of it. Labels stay on one line, always.
    "ict-press inline-flex items-center gap-2.5 whitespace-nowrap rounded-full font-semibold tracking-[-0.005em]",
    "transition-[background-color,box-shadow,transform] duration-[120ms] ease-ict",
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
    <span
      className={clsx(
        "grid shrink-0 place-items-center rounded-full",
        BUTTON_SIZE[size].badge,
        BADGE_SKIN[variant],
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={clsx(
          "size-[0.85em]",
          dir === "up-right" && "-rotate-45",
          dir === "down" && "rotate-90",
        )}
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

/** Same shape, as a link. Navigation is a link, not a button with an onClick. */
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

type CardVariant = "dark" | "raised" | "feature" | "framed" | "brand";

const CARD_SKIN: Record<CardVariant, string> = {
  /** The default panel on dark: hairline border, inset top highlight, no drop shadow. */
  dark: "bg-ict-ink-850 border border-ict-border-dark shadow-ict-inset",
  /** One step up from the page — nested panels, rows inside a card. */
  raised: "bg-ict-ink-800 border border-ict-border-dark",
  /** The cocoa banner. The system permits exactly ONE of these per screen. */
  feature: "bg-ict-cocoa-700 border border-ict-cocoa-600",
  /** Near-black frame for a featured item. */
  framed: "bg-ict-ink-900 border-2 border-ict-ink-900",
  /** Solid orange. Rationed — an upsell or a single decisive call to action. */
  brand: "bg-ict-orange-500 text-white",
};

export function Card({
  variant = "dark",
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
        { md: "rounded-ict-md", card: "rounded-ict-card", panel: "rounded-ict-panel" }[radius],
        CARD_SKIN[variant],
        hoverable && "ict-lift hover:border-ict-ink-500",
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
  variant = "dark",
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
        "block ict-lift hover:border-ict-ink-500",
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
 *
 * The period is the system's signature typographic tic and is capped at **once
 * per screen** — so it defaults to off here and you opt in on the one headline
 * that carries the page.
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
    <Tag className={clsx("font-display text-xl font-extrabold tracking-[-0.02em] text-ict-paper-50 sm:text-2xl", className)}>
      {children}
      {period ? <span className="text-ict-orange-500">.</span> : null}
    </Tag>
  );
}

/** Standard page header for every screen inside the app shell. */
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
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-paper-50 sm:text-[30px]">
          {title}
          {period ? <span className="text-ict-orange-500">.</span> : null}
        </h1>
        {subtitle ? <p className="mt-1.5 text-sm text-ict-ink-300">{subtitle}</p> : null}
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

/**
 * Status is a dot, not an icon.
 *
 * Six pixels of semantic colour beside a one-word label. This is the ONLY way
 * semantic hues enter the interface — they are never a fill for a large area,
 * because a green panel and a red panel on warm near-black read as two
 * different products.
 */
export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return <span aria-hidden className={clsx("size-1.5 shrink-0 rounded-full", DOT_COLOR[tone], className)} />;
}

/** Dot plus label in a dark pill. The workhorse status affordance. */
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
        "inline-flex h-[26px] items-center gap-1.5 rounded-full bg-ict-ink-800 px-2.5 text-xs font-semibold text-ict-paper-50",
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
    success: "bg-ict-green-500/15 text-ict-green-500",
    warning: "bg-ict-amber-500/15 text-ict-amber-500",
    danger: "bg-ict-red-500/20 text-[#f0685a]",
    info: "bg-ict-blue-500/15 text-ict-blue-500",
    event: "bg-ict-violet-500/15 text-ict-violet-500",
    brand: "bg-ict-orange-500/15 text-ict-orange-400",
    neutral: "bg-ict-ink-700 text-ict-ink-200",
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
        active ? "bg-ict-orange-500 text-white" : "bg-ict-ink-800 text-ict-paper-50",
        className,
      )}
    >
      {icon ? <Icon name={icon} className={clsx("!text-sm", active ? "" : "text-ict-orange-400")} /> : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The brand's icon container: a soft-square (or circle) holding a line glyph.
 * `done` adds the small orange check that marks a completed module.
 */
export function IconBadge({
  icon,
  tone = "dark",
  size = 44,
  round,
  done,
  className,
}: {
  icon: IconName;
  tone?: "dark" | "brand" | "soft" | "tile";
  size?: number;
  round?: boolean;
  done?: boolean;
  className?: string;
}) {
  const skin = {
    dark: "bg-ict-ink-800 text-ict-ink-200",
    brand: "bg-ict-orange-500 text-white",
    soft: "bg-ict-orange-500/12 text-ict-orange-400",
    tile: "bg-white text-ict-ink-900",
  }[tone];

  return (
    <span
      style={{ width: size, height: size }}
      className={clsx(
        "relative grid shrink-0 place-items-center",
        round ? "rounded-full" : "rounded-ict-md",
        skin,
        className,
      )}
    >
      <Icon name={icon} className="!text-[1.1rem]" />
      {done ? (
        <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full border-2 border-ict-ink-850 bg-ict-orange-500">
          <Icon name="done" className="!text-[8px] text-white" strokeWidth={4} />
        </span>
      ) : null}
    </span>
  );
}

/** 6px pill track, orange fill, percentage to the right. Animates once. */
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
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ict-ink-700">
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-ict-orange-500 transition-[width] duration-[340ms] ease-ict-out"
        />
      </div>
      {showLabel ? <span className="text-sm font-semibold tabular-nums text-ict-paper-50">{pct}%</span> : null}
    </div>
  );
}

/**
 * A metric on a dark panel: label, big number, optional hint.
 *
 * Deliberately not the system's centred marketing `StatTile` — in the product
 * these sit in a row and get scanned down the left edge, so they are
 * left-aligned and the number carries the weight.
 */
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
        <Icon
          name={icon}
          className={clsx("!text-base", tone === "neutral" ? "text-ict-ink-300" : "text-ict-orange-400")}
        />
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-ict-ink-300">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-paper-50">{value}</p>
      {hint ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-ict-ink-300">
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

export function Avatar({
  name,
  size = 34,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={clsx(
        "grid shrink-0 place-items-center rounded-full bg-ict-ink-700 font-semibold text-ict-paper-50",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The system's empty-state voice: say what is missing and what to do about it,
 * in one sentence. Never "No data available".
 */
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
      <p className="mt-4 font-display text-base font-bold text-ict-paper-50">{title}</p>
      {body ? <p className="mt-1.5 max-w-sm text-sm text-ict-ink-300">{body}</p> : null}
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
        {hint ? <p className="mt-0.5 text-sm text-ict-ink-300">{hint}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-ict-ink-300 transition-colors duration-[120ms] hover:text-ict-orange-400"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
