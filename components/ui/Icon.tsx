import { clsx } from "clsx";

/**
 * One place naming every icon glyph the app uses, so a typo in a Material
 * Symbols name fails at compile time instead of rendering nothing at runtime.
 */
export type IconName =
  | "school"
  | "home"
  | "account_circle"
  | "logout"
  | "menu"
  | "close"
  | "chevron_right"
  | "arrow_back"
  | "event"
  | "videocam"
  | "local_fire_department"
  | "bolt"
  | "check_circle"
  | "cancel"
  | "schedule"
  | "description"
  | "quiz"
  | "code"
  | "military_tech"
  | "workspace_premium"
  | "cloud_upload"
  | "credit_card"
  | "receipt_long"
  | "group"
  | "insights"
  | "add_task"
  | "link"
  | "lock"
  | "language"
  | "grade"
  | "auto_stories"
  | "chat"
  | "family_restroom"
  | "smartphone"
  | "download"
  | "timer"
  | "mail"
  | "send"
  | "play_circle"
  | "notifications_active"
  | "search"
  | "content_copy"
  | "filter_list"
  | "chevron_left"
  | "inbox"
  | "priority_high"
  | "computer"
  | "memory"
  | "settings"
  | "hub"
  | "account_tree"
  | "storage"
  | "terminal"
  | "sensors"
  | "storefront"
  | "auto_awesome"
  | "assignment"
  | "expand_more"
  | "unfold_more"
  | "unfold_less"
  | "north_east"
  | "grid_view"
  | "route"
  | "arrow_forward"
  | "flag"
  | "live_tv"
  | "calendar_month"
  | "co_present"
  | "manage_search"
  | "edit_note"
  | "fact_check"
  | "work"
  | "save"
  | "image"
  | "payments"
  | "account_balance"
  | "rule"
  | "print"
  | "gavel"
  | "lock_open"
  | "info"
  | "play_arrow";

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <span aria-hidden className={clsx("material-symbols-outlined", className)}>
      {name}
    </span>
  );
}
