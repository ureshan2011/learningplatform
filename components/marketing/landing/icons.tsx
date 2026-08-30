/**
 * Landing-page icon set as inline SVG.
 *
 * The rest of the app uses the Material Symbols web font (see
 * components/ui/Icon.tsx), but that font is fetched from Google Fonts at
 * runtime — on a slow connection, an ad blocker, or a network that blocks
 * fonts.googleapis.com, the glyph never arrives and the icon renders as
 * blank or as its raw ligature text overlapping whatever sits next to it.
 * That broke the landing page's CTA buttons in practice, so its icons are
 * plain SVG paths instead: zero network dependency, always render.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}

export function GraduationCapIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M2 8l10-5 10 5-10 5-10-5z" />
      <path d="M6 10.5V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.5" />
      <path d="M22 8v6" />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M15.8 14.1c2.7.5 4.7 2.7 4.7 5.9" />
    </svg>
  );
}

export function PresenterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
      <path d="M7 10l3-3 2.5 2.5L17 5" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="8.5" r="5" />
      <path d="M9 12.7L6.5 21l5.5-3 5.5 3-2.5-8.3" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 7h9M4 12h6M4 17h4" />
      <path d="M14.5 15.5L20 10l-3-3-5.5 5.5L10.5 16z" />
    </svg>
  );
}

export function ChecklistIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M7.5 12l2 2 4-4.5M7.5 16.5h5.5" />
    </svg>
  );
}

export function VideoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l6-3.3v10.6l-6-3.3" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg {...base} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden>
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3v11M8 10l4 4 4-4" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export function QuestionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-1 .8-1 1.5v.3" />
      <path d="M11.7 17h.1" />
    </svg>
  );
}

export function PlayCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.2 8.8l5.2 3.2-5.2 3.2z" />
    </svg>
  );
}

export function FlaskIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M10 3h4M10.5 3v6L5 18.2A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-2.8L13.5 9V3" />
      <path d="M8 15h8" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
      <path d="M8.5 10h7M8.5 13h4" />
    </svg>
  );
}

export function TranslateIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3 6h8M7 4.5V6c0 3.6-1.7 6.6-4 8.2" />
      <path d="M5 10.5c1.2 2.3 3 3.9 5.2 4.6" />
      <path d="M12.5 21l4-11 4 11M14 17.5h5" />
    </svg>
  );
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 4.5L3.8 6.6v13L9 17.4l6 2.1 5.2-2.1v-13L15 6.6z" />
      <path d="M9 4.5v12.9M15 6.6v12.9" />
    </svg>
  );
}

export function CertificateIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M7 8.5h6M7 11.5h4" />
      <path d="M16.5 16v5l2-1.4 2 1.4v-5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3.5 12L12 16.2 20.5 12M3.5 16.5L12 20.7l8.5-4.2" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
