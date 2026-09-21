import { Icon } from "@/components/ui/Icon";
import { Badge, Card, Eyebrow, SectionBar } from "@/components/ds";
import {
  BUILD_TIMINGS,
  CANVAS_ATTRIBUTION,
  CANVAS_BLOCKS,
  CHOOSING_RULES,
  COMMON_MISTAKES,
  DEBRIEF_QUESTION,
  GROUP_ROLES,
  LINKING_INSTRUCTION,
  MATERIALS,
  MATERIALS_NOTE,
  PITCH_POINTS,
  RUBRIC,
  RUBRIC_TOTAL,
  RUN_SHEET,
  RUN_SHEET_NOTE,
  WORKED_EXAMPLE,
  type CanvasSide,
} from "@/lib/content/business-model-canvas";

/**
 * The Business Model Canvas lesson: the tutorial, then the group activity.
 *
 * Built from `components/ds/` and the role tokens, so it renders as white
 * cards on the public page and near-black panels if it is ever mounted inside
 * `.ict-app`. That was the point of making the primitives world-agnostic —
 * wherever this lesson eventually lands, the markup does not change.
 *
 * The activity is paper-based on purpose and there is nothing interactive
 * here. A canvas filled on a screen is filled by whoever holds the laptop; a
 * canvas on A1 with sticky notes is filled by six people standing round it,
 * which is the thing being taught.
 */
export function BusinessModelCanvasBody() {
  return (
    <>
      <TutorialSection />
      <ActivitySection />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The tutorial                                                                */
/* -------------------------------------------------------------------------- */

function TutorialSection() {
  return (
    <section>
      <Card radius="panel" className="p-6 sm:p-8">
        <Eyebrow>What it is</Eyebrow>
        <p className="mt-3 text-base text-ict-fg">
          A one-page picture of how a business creates, delivers and captures value. Nine boxes on a
          single sheet.
        </p>
        <p className="mt-3 text-sm text-ict-fg-soft">
          The point is not the boxes. It is that a business model is a <strong>system</strong> —
          change one box and others have to change with it. A thirty-page business plan hides that.
          One page makes it impossible to hide.
        </p>
        <p className="mt-4 text-xs text-ict-fg-mute">{CANVAS_ATTRIBUTION}</p>
      </Card>

      <div className="mt-8">
        <SectionBar
          title="The layout"
          hint="Draw this on the board, or print it at A1. Proportions matter less than the left/right split."
        />
        <CanvasDiagram />
      </div>

      <div className="mt-8">
        <SectionBar title="The nine blocks" hint="Numbered in the order they should be filled" />
        <ul className="space-y-2">
          {CANVAS_BLOCKS.map((block) => (
            <li key={block.key}>
              <Card radius="md" className="flex items-start gap-3 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ict-surface-sunken font-mono text-xs font-bold text-ict-fg">
                  {block.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ict-fg">{block.title}</span>
                    <SideBadge side={block.side} />
                  </span>
                  <span className="mt-1 block text-sm text-ict-fg-soft">{block.question}</span>
                  <span className="mt-2 flex items-start gap-1.5 text-xs text-ict-fg-mute">
                    <Icon name="priority_high" className="mt-0.5 !text-sm shrink-0" />
                    {block.watchOut}
                  </span>
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <SectionBar
          title="Fill them in this order"
          hint="Not left to right — customer first, money before machinery"
        />
        <Card radius="card" className="p-5">
          <p className="text-sm text-ict-fg">
            {CANVAS_BLOCKS.map((block, i) => (
              <span key={block.key}>
                {i > 0 ? <span className="text-ict-fg-mute"> → </span> : null}
                <span className="font-mono text-xs text-ict-fg-mute">{block.order}</span>{" "}
                {block.title}
              </span>
            ))}
          </p>
          <p className="mt-3 text-sm text-ict-fg-soft">
            Customer first, because everything else is a consequence of who you chose. Money before
            machinery, because knowing what people pay for tells you what you actually need to
            build.
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <SectionBar
          title={`Worked example — ${WORKED_EXAMPLE.business}`}
          hint="Five minutes on the board, before the groups start"
        />
        <Card radius="card" className="p-5">
          <ul className="space-y-3">
            {WORKED_EXAMPLE.rows.map((row) => (
              <li key={row.block} className="text-sm">
                <span className="font-semibold text-ict-fg">{row.block}</span>
                <span className="mt-0.5 block text-ict-fg-soft">{row.note}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card variant="feature" radius="card" className="mt-3 p-5">
          <p className="text-sm text-ict-on-feature">{WORKED_EXAMPLE.systemQuestion}</p>
        </Card>
      </div>
    </section>
  );
}

const SIDE_LABEL: Record<CanvasSide, string> = {
  market: "Market",
  hinge: "The hinge",
  machine: "The machine",
  money: "Money",
};

function SideBadge({ side }: { side: CanvasSide }) {
  return <Badge tone={side === "hinge" ? "brand" : "neutral"}>{SIDE_LABEL[side]}</Badge>;
}

/**
 * The nine boxes in their real arrangement.
 *
 * A real grid rather than a picture, so it reflows to a single readable column
 * on a phone instead of becoming a diagram nobody can zoom into. The left and
 * right halves keep their labels at every width, because that split is the
 * whole teaching point.
 */
function CanvasDiagram() {
  const cell =
    "rounded-ict-md border border-ict-line bg-ict-surface-card p-3 text-xs font-semibold text-ict-fg";

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-5">
        <div className={`${cell} sm:row-span-2`}>Key partners</div>
        <div className={cell}>Key activities</div>
        <div className={`${cell} sm:row-span-2 border-ict-orange-500`}>Value propositions</div>
        <div className={cell}>Customer relationships</div>
        <div className={`${cell} sm:row-span-2`}>Customer segments</div>
        <div className={cell}>Key resources</div>
        <div className={cell}>Channels</div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className={cell}>Cost structure</div>
        <div className={cell}>Revenue streams</div>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-ict-fg-mute">
        <span>← the machine: what it takes to deliver</span>
        <span>the market: who, and why they care →</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The activity                                                                */
/* -------------------------------------------------------------------------- */

function ActivitySection() {
  return (
    <section className="mt-12">
      <Card variant="feature" radius="panel" className="p-6 sm:p-8">
        <Eyebrow>Group activity</Eyebrow>
        <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-[-0.03em] text-ict-on-feature">
          Canvas a real business
        </h2>
        <p className="mt-3 max-w-lg text-sm text-ict-on-feature-soft">
          Ninety minutes. Groups of six, paper and sticky notes, ending in a three-minute pitch to
          the class. One completed A1 canvas per group.
        </p>
      </Card>

      <div className="mt-8">
        <SectionBar title="Materials, per group" />
        <Card radius="card" className="p-5">
          <ul className="space-y-2">
            {MATERIALS.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ict-fg">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-ict-orange-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ict-fg-soft">{MATERIALS_NOTE}</p>
        </Card>
      </div>

      <div className="mt-8">
        <SectionBar title="Run sheet" hint="Ninety minutes, including the introduction" />
        <ul className="space-y-2">
          {RUN_SHEET.map((row) => (
            <li
              key={row.at}
              className="flex items-center gap-3 rounded-ict-md border border-ict-line bg-ict-surface-card p-3.5"
            >
              <span className="w-12 shrink-0 font-mono text-xs text-ict-fg-mute">{row.at}</span>
              <span className="w-14 shrink-0 text-xs tabular-nums text-ict-fg-soft">
                {row.minutes} min
              </span>
              <span className="min-w-0 flex-1 text-sm text-ict-fg">{row.what}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ict-fg-soft">{RUN_SHEET_NOTE}</p>
      </div>

      <div className="mt-8">
        <SectionBar
          title="The six roles"
          hint="Assign these aloud before they start — an unassigned group of six is two people working and four watching"
        />
        <ul className="grid gap-2 sm:grid-cols-2">
          {GROUP_ROLES.map((role) => (
            <li key={role.order} className="min-w-0">
              <Card radius="md" className="flex h-full items-start gap-3 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ict-surface-sunken font-mono text-xs font-bold text-ict-fg">
                  {role.order}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ict-fg">{role.title}</span>
                  <span className="mt-0.5 block text-xs text-ict-fg-soft">{role.does}</span>
                </span>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ict-fg-soft">
          <strong className="text-ict-fg">Value propositions is nobody&rsquo;s job alone.</strong>{" "}
          The whole group does that block together, and it is done second.
        </p>
      </div>

      <div className="mt-8">
        <SectionBar title="Choosing the business" hint="One real business per group" />
        <Card radius="card" className="p-5">
          <ul className="space-y-2.5">
            {CHOOSING_RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm text-ict-fg-soft">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-ict-orange-500" />
                {rule}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <SectionBar
          title="The build phase"
          hint="How to spend the thirty-five minutes, so nobody loses twenty on key partners"
        />
        <ul className="space-y-2">
          {BUILD_TIMINGS.map((row) => (
            <li
              key={row.block}
              className="flex items-center justify-between gap-3 rounded-ict-md border border-ict-line bg-ict-surface-card px-4 py-3 text-sm"
            >
              <span className="min-w-0 text-ict-fg">{row.block}</span>
              <span className="shrink-0 tabular-nums text-ict-fg-soft">{row.minutes} min</span>
            </li>
          ))}
        </ul>
        <Card variant="feature" radius="card" className="mt-3 p-5">
          <Eyebrow>At the thirty-minute mark</Eyebrow>
          <p className="mt-2 text-sm text-ict-on-feature">{LINKING_INSTRUCTION}</p>
          <p className="mt-2 text-sm text-ict-on-feature-soft">
            That single step is where most groups learn the most.
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <SectionBar title="The pitch" hint="Three minutes, strictly timed, in this order" />
        <ul className="space-y-2">
          {PITCH_POINTS.map((point) => (
            <li
              key={point.order}
              className="flex items-center gap-3 rounded-ict-md border border-ict-line bg-ict-surface-card p-3.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ict-surface-sunken font-mono text-xs font-bold text-ict-fg">
                {point.order}
              </span>
              <span className="min-w-0 flex-1 text-sm text-ict-fg">{point.what}</span>
              <span className="shrink-0 text-xs tabular-nums text-ict-fg-soft">
                {point.seconds}s
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ict-fg-soft">
          Point four is the one that separates a group that understood the exercise from one that
          filled in boxes.
        </p>
      </div>

      <div className="mt-8">
        <SectionBar title="Marking rubric" hint={`${RUBRIC_TOTAL} marks — adjust the weights, keep the criteria`} />
        <ul className="space-y-2">
          {RUBRIC.map((row) => (
            <li key={row.criterion}>
              <Card radius="md" className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ict-fg">{row.criterion}</p>
                  <Badge tone="neutral">{row.marks} marks</Badge>
                </div>
                <p className="mt-1.5 text-sm text-ict-fg-soft">{row.full}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <SectionBar title="Common mistakes" hint="Each one, and the question that exposes it" />
        <ul className="space-y-2">
          {COMMON_MISTAKES.map((row) => (
            <li
              key={row.mistake}
              className="rounded-ict-md border border-ict-line bg-ict-surface-card p-4"
            >
              <p className="text-sm text-ict-fg">{row.mistake}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ict-fg-soft">
                <Icon name="quiz" className="mt-0.5 !text-sm shrink-0 text-ict-accent-fg" />
                {row.ask}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <SectionBar title="Debrief" hint="Four minutes, one question" />
        <Card radius="card" className="p-5">
          <p className="text-sm text-ict-fg">{DEBRIEF_QUESTION}</p>
          <p className="mt-2 text-sm text-ict-fg-soft">
            It forces every student to re-read someone else&rsquo;s canvas as a system rather than
            as nine boxes.
          </p>
        </Card>
      </div>
    </section>
  );
}
