import type { Translator } from "@/lib/i18n/server";

/**
 * The strings `ResourceActions` needs, in one place.
 *
 * It is a client component, so the dictionary cannot reach it — every string
 * has to arrive as a prop (see CLAUDE.md, Language). Two pages list files and
 * both would otherwise spell out the same eight keys, which is how one of them
 * ends up untranslated after the next copy change.
 */
export function resourceLabels(t: Translator) {
  return {
    read: t("doc.read"),
    download: t("library.download"),
    preparing: t("doc.preparing"),
    failed: t("doc.failed"),
    expired: t("pack.expired"),
    page: t("doc.page"),
    of: t("doc.of"),
    close: t("doc.close"),
  };
}
