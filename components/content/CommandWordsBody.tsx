import { COMMAND_WORDS } from "@/lib/content/command-words";
import { Icon } from "@/components/ui/Icon";
import { Badge, Card } from "@/components/ds";

/**
 * The command-word reference: what "explain" requires that "state" does not.
 *
 * Extracted from `/command-words` so a signed-in student can read it inside
 * the app rather than being dropped onto the public marketing page. It names
 * no palette colour, so it is white cards on the public route and near-black
 * panels inside `.ict-app`.
 *
 * The tip line used to be `bg-ict-orange-500/12` with `text-ict-accent-fg` — a
 * pale orange wash that reads as "gently highlighted" on cream and as a
 * glowing slab on near-black, and a second orange in a card that already has
 * one. It is a raised neutral row with an orange glyph now: same emphasis,
 * one accent.
 */
export function CommandWordsBody() {
  return (
    <ul className="space-y-4">
      {COMMAND_WORDS.map((cw) => (
        <li key={cw.word}>
          <Card radius="card" className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-extrabold text-ict-fg">{cw.word}</h2>
              <Badge tone="neutral">{cw.typicalMarks}</Badge>
            </div>
            <p className="si mt-1 text-sm text-ict-fg-mute" lang="si">
              {cw.sinhala}
            </p>
            <p className="mt-3 text-sm text-ict-fg-soft">{cw.meaning}</p>
            <p className="mt-3 flex items-start gap-2 rounded-ict-md bg-ict-surface-raised p-3 text-sm text-ict-fg">
              <Icon name="bolt" className="mt-0.5 shrink-0 !text-base text-ict-accent-fg" />
              {cw.tip}
            </p>
            <p className="mt-3 text-sm text-ict-fg-soft">
              <span className="font-semibold text-ict-fg">Example: </span>
              {cw.example}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
