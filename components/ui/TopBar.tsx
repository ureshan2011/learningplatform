import Link from "next/link";

const WIDTH: Record<string, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  "3xl": "max-w-3xl",
  "6xl": "max-w-6xl",
};

/**
 * Sticky translucent chrome shared by every inner page — a back link and an
 * optional trailing action, floating over content rather than consuming a
 * fixed opaque strip. Each page still renders its own large heading below.
 */
export function TopBar({
  back,
  trailing,
  maxWidth = "3xl",
}: {
  back?: { href: string; label: string };
  trailing?: React.ReactNode;
  maxWidth?: keyof typeof WIDTH;
}) {
  return (
    <div className="material-nav pt-safe sticky top-0 z-40">
      <div className={`mx-auto flex items-center justify-between gap-4 px-5 py-3 ${WIDTH[maxWidth]}`}>
        {back ? (
          <Link
            href={back.href}
            className="press inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-muted) transition-colors duration-150 hover:text-(--color-text)"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
