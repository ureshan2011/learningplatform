/**
 * CPU scheduling algorithms, with the Gantt chart and the timing table they
 * produce.
 *
 * Competency level 5.3 is six periods on process management, and the part that
 * is actually calculated in an exam is this: given arrival and burst times,
 * draw the Gantt chart and work out average waiting and turnaround time. It is
 * a question students can do slowly and cannot do reliably, because one
 * misplaced segment shifts every number after it and there is no way to check
 * the answer except by redoing it.
 *
 * The three algorithms here are the three the syllabus names. Each returns the
 * same shape, so the component can put them side by side — which is the
 * comparison the theory question asks for ("state one advantage of round robin
 * over first come first served") and the reason this is one module rather than
 * three.
 */

import type { Locale } from "@/lib/i18n/dictionary";

export interface Process {
  id: string;
  arrival: number;
  burst: number;
}

/** One block on the Gantt chart. An idle block has no process. */
export interface GanttSegment {
  id: string | null;
  start: number;
  end: number;
}

export interface ProcessMetrics {
  id: string;
  arrival: number;
  burst: number;
  completion: number;
  /** Completion − arrival: how long the process was in the system altogether. */
  turnaround: number;
  /** Turnaround − burst: how long it spent waiting rather than running. */
  waiting: number;
}

export interface ScheduleResult {
  segments: GanttSegment[];
  metrics: ProcessMetrics[];
  averageWaiting: number;
  averageTurnaround: number;
}

export type AlgorithmId = "fcfs" | "sjf" | "rr";

export interface Algorithm {
  id: AlgorithmId;
  label: string;
  full: string;
  /** How it decides, in one line a student can write in an answer. */
  rule: string;
  /** The trade-off the theory question asks about. */
  tradeoff: string;
  preemptive: boolean;
}

const ALGORITHM_DATA: Array<{
  id: AlgorithmId;
  label: Record<Locale, string>;
  full: Record<Locale, string>;
  rule: Record<Locale, string>;
  tradeoff: Record<Locale, string>;
  preemptive: boolean;
}> = [
  {
    id: "fcfs",
    label: { en: "FCFS", si: "FCFS" },
    full: { en: "First come, first served", si: "First come, first served" },
    rule: {
      en: "Processes run in the order they arrive, and each runs to completion before the next starts.",
      si: "ක්‍රියාවලි පැමිණි පිළිවෙළට run වෙනවා, එකක් ඉවර වෙනකම් ඊළඟ එක පටන් ගන්නේ නෑ.",
    },
    tradeoff: {
      en: "Simple and never starves anyone, but one long process at the front makes everything behind it wait — the convoy effect.",
      si: "සරලයි, කාටවත් starvation එකක් නෑ. හැබැයි ඉස්සරහින් තියෙන දිග ක්‍රියාවලියක් නිසා පිටිපස්සේ තියෙන හැම එකක්ම බලාගෙන ඉන්න වෙනවා — ඒකට convoy effect කියනවා.",
    },
    preemptive: false,
  },
  {
    id: "sjf",
    label: { en: "SJF", si: "SJF" },
    full: { en: "Shortest job first", si: "Shortest job first" },
    rule: {
      en: "Whenever the CPU is free, the shortest of the processes that have arrived runs next, to completion.",
      si: "CPU එක නිදහස් වුණු හැම වෙලාවකම, ඇවිත් තියෙන ක්‍රියාවලිවලින් කෙටිම එක ඊළඟට run වෙනවා, ඉවර වෙනකම්.",
    },
    tradeoff: {
      en: "Gives the lowest possible average waiting time, but needs the burst time known in advance, and a steady stream of short jobs can starve a long one forever.",
      si: "සාමාන්‍ය රැඳී සිටීමේ කාලය අඩුම කරනවා. හැබැයි burst කාලය කලින් දැනගෙන ඉන්න ඕන, තව කෙටි job එනවා නම් දිග එකකට කවදාවත් වාරය නොලැබී යන්න පුළුවන් (starvation).",
    },
    preemptive: false,
  },
  {
    id: "rr",
    label: { en: "Round robin", si: "Round robin" },
    full: { en: "Round robin", si: "Round robin" },
    rule: {
      en: "Each process runs for at most one time quantum, then goes to the back of the ready queue if it still has work left.",
      si: "හැම ක්‍රියාවලියක්ම වැඩිම වුණොත් එක time quantum එකක් run වෙනවා, තව වැඩ ඉතුරු නම් ආපහු ready පෝලිමේ අගට යනවා.",
    },
    tradeoff: {
      en: "Fair, responsive, and the basis of time sharing — but every switch costs time, so too small a quantum spends the CPU on context switching instead of work.",
      si: "සාධාරණයි, ඉක්මනින් ප්‍රතිචාර දෙනවා, time sharing එකේ පදනම මේකයි. හැබැයි හැම switch එකකටම කාලය යනවා, ඒ නිසා quantum එක ගොඩක් කුඩා නම් CPU එක වැඩ කරනවා වෙනුවට context switch කරගෙන ඉන්නවා.",
    },
    preemptive: true,
  },
];

export function algorithms(locale: Locale = "en"): Algorithm[] {
  return ALGORITHM_DATA.map((a) => ({
    id: a.id,
    label: a.label[locale],
    full: a.full[locale],
    rule: a.rule[locale],
    tradeoff: a.tradeoff[locale],
    preemptive: a.preemptive,
  }));
}

/** The worked example. Chosen so the three algorithms give visibly different answers. */
export const SAMPLE_PROCESSES: Process[] = [
  { id: "P1", arrival: 0, burst: 5 },
  { id: "P2", arrival: 1, burst: 3 },
  { id: "P3", arrival: 2, burst: 8 },
  { id: "P4", arrival: 3, burst: 2 },
];

function summarise(processes: Process[], completion: Record<string, number>, segments: GanttSegment[]): ScheduleResult {
  const metrics: ProcessMetrics[] = processes.map((p) => {
    const turnaround = completion[p.id] - p.arrival;
    return {
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      completion: completion[p.id],
      turnaround,
      waiting: turnaround - p.burst,
    };
  });

  const total = metrics.length || 1;
  return {
    segments,
    metrics,
    averageWaiting: metrics.reduce((s, m) => s + m.waiting, 0) / total,
    averageTurnaround: metrics.reduce((s, m) => s + m.turnaround, 0) / total,
  };
}

/** Merges neighbouring segments for the same process, which round robin can produce. */
function compact(segments: GanttSegment[]): GanttSegment[] {
  const out: GanttSegment[] = [];
  for (const segment of segments) {
    const last = out[out.length - 1];
    if (last && last.id === segment.id && last.end === segment.start) last.end = segment.end;
    else out.push({ ...segment });
  }
  return out;
}

function runNonPreemptive(processes: Process[], pickShortest: boolean): ScheduleResult {
  const pending = [...processes].sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));
  const segments: GanttSegment[] = [];
  const completion: Record<string, number> = {};
  const done = new Set<string>();
  let clock = 0;

  while (done.size < pending.length) {
    const ready = pending.filter((p) => !done.has(p.id) && p.arrival <= clock);

    if (ready.length === 0) {
      // Nothing has arrived yet. The CPU idles until the next arrival — an idle
      // block on the chart, not a gap to be quietly closed up.
      const next = pending.filter((p) => !done.has(p.id)).sort((a, b) => a.arrival - b.arrival)[0];
      segments.push({ id: null, start: clock, end: next.arrival });
      clock = next.arrival;
      continue;
    }

    // Ties break on arrival then id, so the same input always draws the same chart.
    const chosen = pickShortest
      ? ready.reduce((best, p) =>
          p.burst < best.burst || (p.burst === best.burst && p.arrival < best.arrival) ? p : best,
        )
      : ready.reduce((best, p) => (p.arrival < best.arrival ? p : best));

    segments.push({ id: chosen.id, start: clock, end: clock + chosen.burst });
    clock += chosen.burst;
    completion[chosen.id] = clock;
    done.add(chosen.id);
  }

  return summarise(processes, completion, compact(segments));
}

/**
 * Round robin.
 *
 * The ordering rule that decides every exam answer: when a process's quantum
 * expires, anything that arrived *during* that quantum joins the queue before
 * the pre-empted process rejoins it. Getting that backwards is the single most
 * common reason a student's chart disagrees with the marking scheme.
 */
export function roundRobin(processes: Process[], quantum: number): ScheduleResult {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));
  const remaining: Record<string, number> = {};
  for (const p of sorted) remaining[p.id] = p.burst;

  const segments: GanttSegment[] = [];
  const completion: Record<string, number> = {};
  const queue: string[] = [];
  const arrived = new Set<string>();
  let clock = 0;

  const admit = (upTo: number) => {
    for (const p of sorted) {
      if (!arrived.has(p.id) && p.arrival <= upTo) {
        arrived.add(p.id);
        queue.push(p.id);
      }
    }
  };

  admit(clock);

  while (Object.keys(completion).length < sorted.length) {
    if (queue.length === 0) {
      const next = sorted.find((p) => !arrived.has(p.id));
      if (!next) break;
      segments.push({ id: null, start: clock, end: next.arrival });
      clock = next.arrival;
      admit(clock);
      continue;
    }

    const id = queue.shift() as string;
    const slice = Math.min(quantum, remaining[id]);
    segments.push({ id, start: clock, end: clock + slice });
    clock += slice;
    remaining[id] -= slice;

    // Arrivals during the slice are queued before the pre-empted process.
    admit(clock);
    if (remaining[id] > 0) queue.push(id);
    else completion[id] = clock;
  }

  return summarise(processes, completion, compact(segments));
}

export function schedule(
  algorithm: AlgorithmId,
  processes: Process[],
  quantum: number,
): ScheduleResult {
  if (algorithm === "rr") return roundRobin(processes, quantum);
  return runNonPreemptive(processes, algorithm === "sjf");
}

/**
 * The seven process states and what moves a process between them.
 *
 * Seven, not five, because that is what this competency level's own learning
 * outcome asks for: "draw and explain the seven-state process transition
 * diagram". The two extra states are the suspended pair — a process swapped
 * out of main memory to disk by the medium-term scheduler. A five-state
 * answer is a different syllabus's answer and loses marks here.
 *
 * Listed with their transitions rather than drawn as boxes because the exam
 * asks for the transitions by name — "state the event that moves a process
 * from running to ready" — which a picture does not answer.
 */
export interface ProcessState {
  key: string;
  label: string;
  description: string;
  exits: string;
}

const PROCESS_STATE_DATA: Array<{
  key: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  exits: Record<Locale, string>;
}> = [
  {
    key: "new",
    label: { en: "New", si: "New (අලුත්)" },
    description: {
      en: "Being created. Its process control block is being set up and memory is being found for it.",
      si: "හැදෙමින් තියෙනවා. එකේ process control block එක සකස් වෙනවා, මතකය හොයනවා.",
    },
    exits: {
      en: "Admitted to ready. If main memory is short it can be admitted straight to ready/suspend instead, on disk.",
      si: "Ready තත්ත්වයට ඇතුළත් වෙනවා. ප්‍රධාන මතකය මදි නම් කෙලින්ම ready/suspend එකට, disk එකට යන්නත් පුළුවන්.",
    },
  },
  {
    key: "ready",
    label: { en: "Ready", si: "Ready (සූදානම්)" },
    description: {
      en: "In main memory and waiting its turn. It has everything it needs except the CPU.",
      si: "ප්‍රධාන මතකයේ තියෙනවා, වාරය එනකම් බලාගෙන. CPU එක හැර අනිත් හැම දෙයක්ම තියෙනවා.",
    },
    exits: {
      en: "Dispatched to running when the short-term scheduler picks it, or suspended out to ready/suspend.",
      si: "Short-term scheduler එක තෝරගත්තම running එකට යනවා, නැත්නම් ready/suspend එකට යවනවා.",
    },
  },
  {
    key: "running",
    label: { en: "Running", si: "Running (ක්‍රියාත්මක)" },
    description: {
      en: "Actually executing on the CPU. On a single-core machine exactly one process is here at a time.",
      si: "ඇත්තටම CPU එකේ ක්‍රියාත්මක වෙනවා. Single-core යන්ත්‍රයක එක වෙලාවක ඉන්නේ එකම එක ක්‍රියාවලියක් විතරයි.",
    },
    exits: {
      en: "To ready on a time-out or pre-emption, to blocked on an I/O request, or to exit when it finishes.",
      si: "කාලය ඉවර වුණාම හෝ pre-empt වුණාම ready එකට, I/O එකක් ඉල්ලුවම blocked එකට, ඉවර වුණාම exit එකට.",
    },
  },
  {
    key: "blocked",
    label: { en: "Blocked (waiting)", si: "Blocked (බලා සිටින)" },
    description: {
      en: "Waiting for an event — a disk read, a key press, a network reply. It could not use the CPU even if it were offered one.",
      si: "සිදුවීමක් එනකම් බලාගෙන — disk එකකින් කියවීමක්, යතුරක් එබීමක්, network පිළිතුරක්. CPU එක දුන්නත් පාවිච්චි කරන්න බෑ.",
    },
    exits: {
      en: "To ready when the event completes, or suspended out to blocked/suspend. Never straight to running.",
      si: "සිදුවීම ඉවර වුණාම ready එකට, නැත්නම් blocked/suspend එකට. කවදාවත් කෙලින්ම running එකට යන්නේ නෑ.",
    },
  },
  {
    key: "ready_suspend",
    label: { en: "Ready/suspend", si: "Ready/suspend" },
    description: {
      en: "Runnable, but swapped out to disk to free main memory. Nothing is stopping it except that it is not resident.",
      si: "Run කරන්න පුළුවන්, හැබැයි ප්‍රධාන මතකය නිදහස් කරගන්න disk එකට swap කරලා. මතකයේ නැති එක විතරයි ප්‍රශ්නය.",
    },
    exits: {
      en: "Back to ready when it is swapped in (activated).",
      si: "ආපහු මතකයට ගත්තම (activate කළාම) ready එකට.",
    },
  },
  {
    key: "blocked_suspend",
    label: { en: "Blocked/suspend", si: "Blocked/suspend" },
    description: {
      en: "Swapped out to disk and still waiting for its event. Both things are true at once.",
      si: "Disk එකට swap කරලා තියෙනවා, ඒ එක්කම සිදුවීමකුත් එනකම් බලාගෙන. දෙකම එකවර.",
    },
    exits: {
      en: "To ready/suspend when the event completes while it is still out, or back to blocked if it is swapped in first.",
      si: "පිටත ඉද්දී සිදුවීම ඉවර වුණොත් ready/suspend එකට, කලින් මතකයට ගත්තොත් ආපහු blocked එකට.",
    },
  },
  {
    key: "exit",
    label: { en: "Exit (terminated)", si: "Exit (අවසන්)" },
    description: {
      en: "Finished or killed. Its resources are released and its PCB is removed.",
      si: "ඉවරයි, නැත්නම් නවත්වලා. එකේ සම්පත් නිදහස් වෙනවා, PCB එක අයින් වෙනවා.",
    },
    exits: { en: "Nothing leaves this state.", si: "මේ තත්ත්වයෙන් පිටතට යන්නේ නෑ." },
  },
];

export function processStates(locale: Locale = "en"): ProcessState[] {
  return PROCESS_STATE_DATA.map((p) => ({
    key: p.key,
    label: p.label[locale],
    description: p.description[locale],
    exits: p.exits[locale],
  }));
}
