"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Card, Field, Input, Notice, SectionHeading } from "@/components/ds";
import { SURVIVAL_PACK } from "@/lib/content/survival-pack";

const MESSAGES: Record<string, string> = {
  id_is_a_cohort: "That web address already belongs to a Campus Ready intake. Pick another.",
  not_permitted: "You are signed out. Reload and try again.",
  invalid_request: "Check the price and the access period, then try again.",
};

/**
 * Creates the pack, or edits its price.
 *
 * Pre-filled with the Survival Pack throughout, because in practice this form
 * is used once to create it and then occasionally to change the price. Every
 * field stays editable so a second product needs no deploy.
 */
export function CreateProductForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [id, setId] = useState<string>(SURVIVAL_PACK.id);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetchWithSession("/api/teacher/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: id.trim(),
          name: String(form.get("name") ?? "").trim(),
          feeLKR: Number(form.get("feeLKR") ?? SURVIVAL_PACK.feeLKR),
          accessDays: Number(form.get("accessDays") ?? SURVIVAL_PACK.accessDays),
          includedWithCohorts: form.get("includedWithCohorts") === "on",
          active: form.get("active") === "on",
          ...(form.get("description")
            ? { description: String(form.get("description")).trim() }
            : {}),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
      if (!res.ok) throw new Error(MESSAGES[data.error ?? ""] ?? "Could not save the product.");

      setDone(`${data.name} is saved. Upload its files under Content with kind Pack.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card radius="card" className="p-5">
      <SectionHeading as="h2">Create or edit a product</SectionHeading>
      <p className="mt-1.5 text-sm text-ict-ink-300">
        A kit of files and guides sold once, on sale every day of the year. Submitting again with
        the same web address edits what is already there.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4">
        <Field label="Name">
          <Input name="name" defaultValue={SURVIVAL_PACK.name} required maxLength={120} />
        </Field>

        <Field label="Web address" hint={id ? `/packs/${id}` : "Lowercase letters and hyphens"}>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            maxLength={64}
            pattern="[a-z0-9-]+"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (Rs)">
            <Input
              name="feeLKR"
              type="number"
              min={0}
              max={1000000}
              defaultValue={SURVIVAL_PACK.feeLKR}
              required
            />
          </Field>
          <Field label="Access (days)" hint="1095 is three years — the length of a degree.">
            <Input
              name="accessDays"
              type="number"
              min={1}
              max={3650}
              defaultValue={SURVIVAL_PACK.accessDays}
              required
            />
          </Field>
        </div>

        <Field label="Description" hint="Shown on the sales page. Leave blank for the default.">
          <Input name="description" maxLength={500} />
        </Field>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ict-ink-300">
          <input
            type="checkbox"
            name="includedWithCohorts"
            defaultChecked
            className="size-4 rounded border-ict-border-dark accent-ict-orange-500"
          />
          Included free with every Campus Ready seat
        </label>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ict-ink-300">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="size-4 rounded border-ict-border-dark accent-ict-orange-500"
          />
          On sale
        </label>

        <Button type="submit" disabled={busy} className="justify-center">
          {busy ? "Saving…" : "Save product"}
        </Button>

        <Notice tone="info">
          Upload the files under Content with kind Pack, one per slot. If an upload is refused,
          paste the Storage rules into the Firebase console first.
        </Notice>

        {done ? <Notice tone="success">{done}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </form>
    </Card>
  );
}
