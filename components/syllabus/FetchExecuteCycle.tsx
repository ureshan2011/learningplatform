"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { interpolate } from "@/lib/i18n/dictionary";
import type { ToneColors } from "@/lib/content/unit-visuals";
import type {
  Cell,
  Phase,
  RegisterMeta,
  Registers,
  TraceStep,
} from "@/lib/content/fetch-execute";

/**
 * Everything this interactive says, already in the reader's language.
 *
 * Resolved on the server and handed down, so a Sinhala reader is never sent
 * the English strings and an English reader is never sent the Sinhala — the
 * same rule the interface dictionary follows.
 */
export interface FetchExecuteCopy {
  heading: string;
  intro: string;
  phaseFetch: string;
  phaseDecode: string;
  phaseExecute: string;
  /** "{current}" and "{total}" are interpolated. */
  stepCounter: string;
  registersTitle: string;
  memoryTitle: string;
  registerHint: string;
  memoryHint: string;
  empty: string;
  addressBus: string;
  dataBus: string;
  back: string;
  next: string;
  restart: string;
  finished: string;
}

/**
 * A step-through of the fetch–execute cycle for competency level 2.3.
 *
 * The exam question is never "draw the five boxes" — it is "state the contents
 * of the MAR after step 3", or "explain why the PC is incremented during the
 * fetch". Both need a student to have watched values move, which a printed
 * diagram cannot show and a video cannot be paused inside precisely enough.
 *
 * Stepping is pure indexing into a trace computed once by `buildTrace`, so
 * stepping backwards is exact rather than an attempt to run the machine in
 * reverse, and the registers on screen can never disagree with the memory
 * beside them.
 */
export function FetchExecuteCycle({
  tone,
  trace,
  registers,
  copy,
}: {
  tone: ToneColors;
  trace: TraceStep[];
  registers: RegisterMeta[];
  copy: FetchExecuteCopy;
}) {
  const [index, setIndex] = useState(0);
  const step = trace[index];
  const atEnd = index === trace.length - 1;

  const phases: Array<{ key: Phase; label: string }> = [
    { key: "fetch", label: copy.phaseFetch },
    { key: "decode", label: copy.phaseDecode },
    { key: "execute", label: copy.phaseExecute },
  ];

  return (
    <div className="rounded-ict-card border border-ict-paper-300 bg-ict-paper-50 p-4">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">
        {copy.heading}
      </p>
      <p className="mt-1.5 text-sm text-ict-ink-500">{copy.intro}</p>

      {/* Phase rail — which of the three phases the current micro-operation belongs to. */}
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Cycle phase">
        {phases.map((phase) => {
          const isActive = phase.key === step.phase;
          return (
            <span
              key={phase.key}
              aria-current={isActive ? "step" : undefined}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-[120ms] ease-ict"
              style={
                isActive
                  ? { background: tone.gradTo, borderColor: tone.gradTo, color: "#fff" }
                  : {
                      background: "#fff",
                      borderColor: "var(--color-ict-paper-300)",
                      color: "var(--color-ict-ink-400)",
                    }
              }
            >
              {phase.label}
            </span>
          );
        })}
        <span className="ml-auto self-center text-xs font-semibold text-ict-ink-400">
          {interpolate(copy.stepCounter, { current: index + 1, total: trace.length })}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RegisterPanel
          meta={registers}
          values={step.registers}
          highlight={step.highlight}
          tone={tone}
          title={copy.registersTitle}
          hint={copy.registerHint}
          empty={copy.empty}
        />
        <MemoryPanel
          memory={step.memory}
          activeAddress={step.activeAddress}
          pc={step.registers.pc}
          tone={tone}
          title={copy.memoryTitle}
          hint={copy.memoryHint}
        />
      </div>

      {/* The micro-operation itself, in the syllabus's own arrow notation. */}
      <div
        key={index}
        className="ict-step-enter mt-3 rounded-ict-md p-4"
        style={{ background: tone.soft }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <code
            className="rounded-full px-3 py-1 font-mono text-sm font-bold"
            style={{ background: "#fff", color: tone.ink }}
          >
            {step.operation}
          </code>
          {step.bus ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: tone.ink }}>
              <Icon name="arrow_forward" className="!text-sm" />
              {step.bus === "address" ? copy.addressBus : copy.dataBus}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-ict-ink-500">{step.explanation}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="ict-press flex items-center gap-1.5 rounded-full border border-ict-paper-300 bg-ict-paper-0 px-3.5 py-2 text-sm font-semibold text-ict-ink-500 transition-colors duration-[120ms] ease-ict disabled:opacity-40"
        >
          <Icon name="chevron_left" className="!text-base" />
          {copy.back}
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(trace.length - 1, i + 1))}
          disabled={atEnd}
          className="ict-press flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-[120ms] ease-ict disabled:opacity-40"
          style={{ background: tone.gradTo }}
        >
          {copy.next}
          <Icon name="chevron_right" className="!text-base" />
        </button>
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="ict-press rounded-full px-3.5 py-2 text-sm font-semibold text-ict-ink-400 underline underline-offset-4 transition-colors duration-[120ms] ease-ict"
        >
          {copy.restart}
        </button>
        {atEnd ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ict-green-500">
            <Icon name="check_circle" className="!text-base" />
            {copy.finished}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RegisterPanel({
  meta: metaList,
  values,
  highlight,
  tone,
  title,
  hint,
  empty,
}: {
  meta: RegisterMeta[];
  values: Registers;
  highlight: keyof Registers | null;
  tone: ToneColors;
  title: string;
  hint: string;
  empty: string;
}) {
  return (
    <div className="rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">{title}</p>
      <dl className="mt-2 space-y-1.5">
        {metaList.map((meta) => {
          const value = values[meta.key];
          const isActive = highlight === meta.key;
          return (
            <div
              key={meta.key}
              title={meta.role}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors duration-200 ease-ict"
              style={isActive ? { background: tone.soft } : undefined}
            >
              <dt
                className="w-12 shrink-0 font-mono text-xs font-extrabold"
                style={{ color: isActive ? tone.ink : "var(--color-ict-ink-400)" }}
              >
                {meta.short}
              </dt>
              <dd className="m-0 min-w-0 flex-1 truncate font-mono text-sm font-semibold text-ict-ink-900">
                {value === null ? <span className="text-ict-ink-300">{empty}</span> : String(value)}
              </dd>
              {isActive ? (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: tone.gradTo }}
                />
              ) : null}
            </div>
          );
        })}
      </dl>
      <p className="mt-2 text-xs text-ict-ink-400">{hint}</p>
    </div>
  );
}

function MemoryPanel({
  memory,
  activeAddress,
  pc,
  tone,
  title,
  hint,
}: {
  memory: Cell[];
  activeAddress: number | null;
  pc: number;
  tone: ToneColors;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-ict-md border border-ict-paper-300 bg-ict-paper-0 p-3">
      <p className="text-xs font-bold tracking-wide text-ict-ink-400 uppercase">{title}</p>
      <ol className="mt-2 space-y-1">
        {memory.map((cell) => {
          const isActive = cell.address === activeAddress;
          const isNext = cell.address === pc;
          return (
            <li
              key={cell.address}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1 transition-colors duration-200 ease-ict"
              style={isActive ? { background: tone.soft } : undefined}
            >
              <span className="w-6 shrink-0 font-mono text-xs text-ict-ink-300">{cell.address}</span>
              <span
                className="min-w-0 flex-1 truncate font-mono text-sm"
                style={{
                  color: isActive ? tone.ink : "var(--color-ict-ink-900)",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {cell.label}
              </span>
              {isNext ? (
                <span className="shrink-0 rounded-full bg-ict-paper-200 px-2 py-0.5 text-[11px] font-bold text-ict-ink-400">
                  PC
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-ict-ink-400">{hint}</p>
    </div>
  );
}
