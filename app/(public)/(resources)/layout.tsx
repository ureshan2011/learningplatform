import type { Viewport } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";

/**
 * The free-resource pages — syllabus, notes, past papers, command words, the
 * reference pages — in the same dark world as the signed-in app.
 *
 * These are the pages a student reaches from a search result and then keeps
 * reading once they have signed in. Rendering them cream made the product
 * look like two different sites: the same syllabus unit was white here and
 * near-black at `/subjects/{id}/syllabus/{unitId}`. They now share `.ict-app`,
 * so the role tokens resolve to the dark palette and the `components/ds/`
 * primitives they are built from render exactly as they do behind sign-in.
 *
 * Only the marketing pages (the homepage, classes, Campus Ready) stay cream.
 *
 * Nothing here reads a session: every page below is statically generated for
 * search traffic, and `SiteHeader` recovers the signed-in nav on the client.
 * `ict-print` inverts the page to black on white for printing — nobody prints
 * a near-black page on an inkjet, and the short notes are made to be printed.
 */
export const viewport: Viewport = { themeColor: "#0e0c0b" };

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ict-app ict-print min-h-dvh">
      <div className="print:hidden">
        <SiteHeader user={null} />
      </div>
      {children}
    </div>
  );
}
