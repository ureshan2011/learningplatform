import "server-only";

import type { Locale } from "@/lib/i18n/dictionary";
import { lifeCycleStages } from "@/lib/content/data-life-cycle";
import { buildTrace, registerMeta } from "@/lib/content/fetch-execute";
import { karnaughPresets } from "@/lib/content/karnaugh";
import { normalFormStages } from "@/lib/content/normalization";
import { algorithms, processStates } from "@/lib/content/scheduling";
import type { DataLifeCycleCopy } from "@/components/syllabus/DataLifeCycleWalkthrough";
import type { FetchExecuteCopy } from "@/components/syllabus/FetchExecuteCycle";
import type { KarnaughCopy } from "@/components/syllabus/KarnaughMapLab";
import type { NormalizationCopy } from "@/components/syllabus/NormalizationWalkthrough";
import type { SchedulingCopy } from "@/components/syllabus/ProcessSchedulingLab";

/**
 * Every lesson interactive's data and wording, resolved to one language.
 *
 * Built on the server and handed down as props, so a Sinhala reader is never
 * sent the English strings and an English reader is never sent the Sinhala —
 * the same rule `dictionary.ts` follows for the interface. The interactives
 * themselves then hold no copy at all, which is also what makes adding a third
 * language a change to this file rather than to four components.
 *
 * ## A note on the Sinhala
 *
 * Everyday spoken Sinhala for the explanation, with the exam's own terms left
 * in English where the Sinhala paper prints them in English: register names,
 * SQL, the normal forms, opcode, quantum, FCFS. That is how a Sinhala-medium
 * ICT class actually talks, and a coined equivalent a student will not meet in
 * the exam hall is worse than the English word it replaced.
 *
 * Subject vocabulary that does have a settled Sinhala form lives in
 * `lib/i18n/ict-terms.ts`, in one place, so it can be checked against the NIE
 * teachers' resource book in a single pass.
 */

export interface LessonInteractiveData {
  dataLifeCycle: {
    stages: ReturnType<typeof lifeCycleStages>;
    copy: DataLifeCycleCopy;
  };
  fetchExecute: {
    trace: ReturnType<typeof buildTrace>;
    registers: ReturnType<typeof registerMeta>;
    copy: FetchExecuteCopy;
  };
  karnaugh: {
    presets: ReturnType<typeof karnaughPresets>;
    copy: KarnaughCopy;
  };
  scheduling: {
    algorithms: ReturnType<typeof algorithms>;
    states: ReturnType<typeof processStates>;
    copy: SchedulingCopy;
  };
  normalization: {
    stages: ReturnType<typeof normalFormStages>;
    copy: NormalizationCopy;
  };
}

const DATA_LIFE_CYCLE_COPY: Record<Locale, DataLifeCycleCopy> = {
  en: {
    heading: "Try it — follow one record through the life cycle",
    stageLabel: "Data life cycle stage",
  },
  si: {
    heading: "කර බලන්න — එක වාර්තාවක් life cycle එක හරහා ගෙනියන්න",
    stageLabel: "දත්ත ජීවන චක්‍රයේ අදියර",
  },
};

const FETCH_EXECUTE_COPY: Record<Locale, FetchExecuteCopy> = {
  en: {
    heading: "Try it — step one instruction through the cycle",
    intro:
      "The program below adds the number at address 5 to the number at address 6 and stores the answer at address 7. Every instruction takes the same four fetch steps and one decode step. Only the execute steps differ.",
    phaseFetch: "Fetch",
    phaseDecode: "Decode",
    phaseExecute: "Execute",
    stepCounter: "Step {current} of {total}",
    registersTitle: "Registers",
    memoryTitle: "Main memory",
    registerHint: "Hover a register name to see what it is for.",
    memoryHint: "Addresses 0–3 hold the program. 5–7 hold its data.",
    empty: "empty",
    addressBus: "Address bus",
    dataBus: "Data bus",
    back: "Back",
    next: "Next step",
    restart: "Start again",
    finished: "Program finished — 12 + 30 = 42, written to address 7",
  },
  si: {
    heading: "කර බලන්න — විධානයක් චක්‍රය හරහා පියවරෙන් පියවර ගෙනියන්න",
    intro:
      "පහල තියෙන වැඩසටහන ලිපිනය 5 එකේ අංකයට ලිපිනය 6 එකේ අංකය එකතු කරලා, උත්තරය ලිපිනය 7 එකේ ගබඩා කරනවා. හැම විධානයකටම එකම fetch පියවර හතරයි එක decode පියවරයි යනවා. වෙනස් වෙන්නේ execute පියවර විතරයි.",
    phaseFetch: "Fetch",
    phaseDecode: "Decode",
    phaseExecute: "Execute",
    stepCounter: "පියවර {current} / {total}",
    registersTitle: "Registers",
    memoryTitle: "ප්‍රධාන මතකය",
    registerHint: "Register එකක නම උඩ hover කරලා ඒක මොකටද කියලා බලන්න.",
    memoryHint: "ලිපින 0–3 වල වැඩසටහන තියෙනවා. 5–7 වල ඒකේ දත්ත.",
    empty: "හිස්",
    addressBus: "ලිපින බසය",
    dataBus: "දත්ත බසය",
    back: "ආපහු",
    next: "ඊළඟ පියවර",
    restart: "ආයෙත් මුලින්ම",
    finished: "වැඩසටහන ඉවරයි — 12 + 30 = 42, ලිපිනය 7 එකට ලිව්වා",
  },
};

const KARNAUGH_COPY: Record<Locale, KarnaughCopy> = {
  en: {
    heading: "Try it — group the map and read off the answer",
    intro:
      "Click a cell to cycle it through 0, 1 and X (don't care). The simplest sum-of-products is worked out as you go, and every group it used is outlined on the map.",
    clear: "Clear",
    axisCaption:
      "Rows are AB, columns are CD, both in Gray code — so neighbouring cells differ by exactly one variable.",
    axisHeader: "AB\\CD",
    cellLabel: "Minterm {minterm}, currently {value}",
    dontCareValue: "don't care",
    beforeTitle: "Before simplifying",
    mintermCountOne: "{count} minterm",
    mintermCountMany: "{count} minterms",
    dontCareCount: ", {count} don't care",
    simplifiedTitle: "Simplified",
    nothingYet: "Nothing to group yet.",
    groupSummaryOne: "One group.",
    groupSummaryOneForced: "One group, and it is forced.",
    groupSummaryMany: "{groups} groups, {essential} of them forced.",
    groupSummaryAll: "{groups} groups, all of them forced.",
    groupCovers: "covers m{minterms} — a group of {size}",
    forced: "Forced",
    footnote:
      'A "forced" group is one covering a cell no other group can reach, so it must be in the answer. Find those first in the exam — the rest of the grouping then has far fewer choices left in it.',
  },
  si: {
    heading: "කර බලන්න — සිතියම සමූහගත කරලා උත්තරය කියවන්න",
    intro:
      "කොටුවක් click කරලා 0, 1, X (don't care) අතර මාරු කරන්න. ඔබ කරගෙන යද්දීම සරලම sum-of-products එක හැදෙනවා, පාවිච්චි කරපු හැම සමූහයක්ම සිතියමේ පෙන්නනවා.",
    clear: "හිස් කරන්න",
    axisCaption:
      "පේළි AB, තීරු CD — දෙකම Gray code එකෙන්. ඒ නිසා යාබද කොටු දෙකක් වෙනස් වෙන්නේ හරියටම එක විචල්‍යයකින් විතරයි.",
    axisHeader: "AB\\CD",
    cellLabel: "Minterm {minterm}, දැන් {value}",
    dontCareValue: "don't care",
    beforeTitle: "සරල කරන්න කලින්",
    mintermCountOne: "minterm {count}",
    mintermCountMany: "minterm {count}",
    dontCareCount: ", don't care {count}",
    simplifiedTitle: "සරල කළාට පස්සේ",
    nothingYet: "තාම සමූහගත කරන්න දෙයක් නෑ.",
    groupSummaryOne: "සමූහ එකයි.",
    groupSummaryOneForced: "සමූහ එකයි, ඒකත් අනිවාර්යයි.",
    groupSummaryMany: "සමූහ {groups}යි, ඒවායින් {essential}ක් අනිවාර්යයි.",
    groupSummaryAll: "සමූහ {groups}යි, ඒ ඔක්කොම අනිවාර්යයි.",
    groupCovers: "m{minterms} ආවරණය කරනවා — {size}ක සමූහයක්",
    forced: "අනිවාර්ය",
    footnote:
      "වෙන කිසිම සමූහයකට ළඟා වෙන්න බැරි කොටුවක් ආවරණය කරන සමූහයක් “අනිවාර්ය” — ඒක උත්තරයේ තියෙන්නම ඕන. විභාගයේදී මුලින්ම ඒවා හොයාගන්න, එතකොට ඉතුරු සමූහගත කිරීමේ තෝරගන්න තියෙන දේවල් ගොඩක් අඩු වෙනවා.",
  },
};

const SCHEDULING_COPY: Record<Locale, SchedulingCopy> = {
  en: {
    heading: "Try it — draw the Gantt chart and read off the averages",
    intro:
      "Four processes arriving at different times. Switch the algorithm and watch both the chart and the average waiting time change, with the same four processes underneath.",
    quantum: "Quantum",
    colProcess: "Process",
    colArrival: "Arrival",
    colBurst: "Burst",
    colCompletion: "Completion",
    colTurnaround: "Turnaround",
    colWaiting: "Waiting",
    average: "Average",
    burstLabel: "Burst time for {id}",
    formulaNote:
      "Turnaround = completion − arrival. Waiting = turnaround − burst. Drag a burst time to see how one long process changes everyone else's wait.",
    idle: "idle",
    statesSummary: "The seven process states, and what moves a process between them",
  },
  si: {
    heading: "කර බලන්න — Gantt ප්‍රස්තාරය අඳිනවා, සාමාන්‍ය අගයන් කියවනවා",
    intro:
      "වෙන වෙන වෙලාවට එන ක්‍රියාවලි හතරක්. ඇල්ගොරිතමය මාරු කරලා, එකම ක්‍රියාවලි හතර එක්කම ප්‍රස්තාරයයි සාමාන්‍ය රැඳී සිටීමේ කාලයයි දෙකම වෙනස් වෙන හැටි බලන්න.",
    quantum: "Quantum",
    colProcess: "ක්‍රියාවලිය",
    colArrival: "පැමිණීම",
    colBurst: "Burst",
    colCompletion: "සම්පූර්ණ වීම",
    colTurnaround: "හැරවුම් කාලය",
    colWaiting: "රැඳී සිටීම",
    average: "සාමාන්‍යය",
    burstLabel: "{id} සඳහා burst කාලය",
    formulaNote:
      "හැරවුම් කාලය = සම්පූර්ණ වීම − පැමිණීම. රැඳී සිටීමේ කාලය = හැරවුම් කාලය − burst. Burst කාලයක් අදලා දිග ක්‍රියාවලියක් අනිත් අයගේ රැඳී සිටීම වෙනස් කරන හැටි බලන්න.",
    idle: "නිෂ්ක්‍රීය",
    statesSummary: "ක්‍රියාවලි තත්ත්ව හතයි, එකකින් තව එකකට යන්නේ මොකද වුණාමද කියන එකයි",
  },
};

const NORMALIZATION_COPY: Record<Locale, NormalizationCopy> = {
  en: {
    heading: "Try it — take one table from unnormalised to 3NF",
    intro:
      "The same student results table at every stage. At each step, the highlighted columns are the ones that break the next rule.",
    stillWrong: "Still wrong",
    anomaliesTitle: "Anomalies this causes",
    done: "In 3NF. Every fact is stored once: a class is renamed in one row, a subject in one row, and a student with no results yet can still exist. For A/L ICT, 3NF is where the question stops.",
    back: "Back",
    fixIt: "Fix it — go to {label}",
    finish: "Done",
  },
  si: {
    heading: "කර බලන්න — එක වගුවක් UNF සිට 3NF දක්වා ගෙනියන්න",
    intro:
      "හැම අදියරකදීම එකම ශිෂ්‍ය ප්‍රතිඵල වගුව. හැම පියවරකදීම, ඊළඟ නීතිය කඩ කරන තීරු highlight කරලා තියෙනවා.",
    stillWrong: "තාම වැරදියි",
    anomaliesTitle: "මේකෙන් හැදෙන විෂමතා",
    done: "දැන් 3NF එකේ. හැම කාරණයක්ම තියෙන්නේ එක තැනක විතරයි: පන්තියක නම වෙනස් කරන්නේ එක පේළියක, විෂයයක නම එක පේළියක, තාම ප්‍රතිඵල නැති ශිෂ්‍යයෙකුත් තියෙන්න පුළුවන්. A/L ICT එකට ප්‍රශ්නය නවතින්නේ 3NF එකෙන්.",
    back: "ආපහු",
    fixIt: "හදනවා — {label} එකට",
    finish: "ඉවරයි",
  },
};

export function buildLessonInteractives(locale: Locale): LessonInteractiveData {
  return {
    dataLifeCycle: {
      stages: lifeCycleStages(locale),
      copy: DATA_LIFE_CYCLE_COPY[locale],
    },
    fetchExecute: {
      trace: buildTrace(locale),
      registers: registerMeta(locale),
      copy: FETCH_EXECUTE_COPY[locale],
    },
    karnaugh: {
      presets: karnaughPresets(locale),
      copy: KARNAUGH_COPY[locale],
    },
    scheduling: {
      algorithms: algorithms(locale),
      states: processStates(locale),
      copy: SCHEDULING_COPY[locale],
    },
    normalization: {
      stages: normalFormStages(locale),
      copy: NORMALIZATION_COPY[locale],
    },
  };
}
