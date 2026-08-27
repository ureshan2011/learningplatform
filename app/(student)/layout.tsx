import { getSessionUser } from "@/lib/auth/session";
import { StudentSidebar } from "@/components/nav/StudentSidebar";

/**
 * Shared shell for the whole signed-in student area: a persistent sidebar
 * instead of the top bar every other route group uses (see SiteHeader).
 *
 * Each page below still runs its own `getSessionUser()` + redirect — this
 * layout does not replace that check, it only supplies the chrome around it.
 * If there is no session, the page underneath is about to redirect to
 * /signin anyway, so the sidebar is skipped rather than flashed.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-(--color-awaken-bg) md:flex">
      <StudentSidebar name={user.name} role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
