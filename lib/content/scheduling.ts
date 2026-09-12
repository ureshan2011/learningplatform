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

export const ALGORITHMS: Algorithm[] = [
  {
    id: "fcfs",
    label: "FCFS",
    full: "First come, first served",
    rule: "Processes run in the order they arrive, and each runs to completion before the next starts.",
    tradeoff:
      "Simple and never starves anyone, but one long process at the front makes everything behind it wait — the convoy effect.",
    preemptive: false,
  },
  {
    id: "sjf",
    label: "SJF",
    full: "Shortest job first",
    rule: "Whenever the CPU is free, the shortest of the processes that have arrived runs next, to completion.",
    tradeoff:
      "Gives the lowest possible average waiting time, but needs the burst time known in advance, and a steady stream of short jobs can starve a long one forever.",
    preemptive: false,
  },
  {
    id: "rr",
    label: "Round robin",
    full: "Round robin",
    rule: "Each process runs for at most one time quantum, then goes to the back of the ready queue if it still has work left.",
    tradeoff:
      "Fair, responsive, and the basis of time sharing — but every switch costs time, so too small a quantum spends the CPU on context switching instead of work.",
    preemptive: true,
  },
];

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
export const PROCESS_STATES = [
  {
    key: "new",
    label: "New",
    description: "Being created. Its process control block is being set up and memory is being found for it.",
    exits:
      "Admitted to ready. If main memory is short it can be admitted straight to ready/suspend instead, on disk.",
  },
  {
    key: "ready",
    label: "Ready",
    description: "In main memory and waiting its turn. It has everything it needs except the CPU.",
    exits: "Dispatched to running when the short-term scheduler picks it, or suspended out to ready/suspend.",
  },
  {
    key: "running",
    label: "Running",
    description: "Actually executing on the CPU. On a single-core machine exactly one process is here at a time.",
    exits:
      "To ready on a time-out or pre-emption, to blocked on an I/O request, or to exit when it finishes.",
  },
  {
    key: "blocked",
    label: "Blocked (waiting)",
    description:
      "Waiting for an event — a disk read, a key press, a network reply. It could not use the CPU even if it were offered one.",
    exits:
      "To ready when the event completes, or suspended out to blocked/suspend. Never straight to running.",
  },
  {
    key: "ready_suspend",
    label: "Ready/suspend",
    description:
      "Runnable, but swapped out to disk to free main memory. Nothing is stopping it except that it is not resident.",
    exits: "Back to ready when it is swapped in (activated).",
  },
  {
    key: "blocked_suspend",
    label: "Blocked/suspend",
    description: "Swapped out to disk and still waiting for its event. Both things are true at once.",
    exits:
      "To ready/suspend when the event completes while it is still out, or back to blocked if it is swapped in first.",
  },
  {
    key: "exit",
    label: "Exit (terminated)",
    description: "Finished or killed. Its resources are released and its PCB is removed.",
    exits: "Nothing leaves this state.",
  },
] as const;
