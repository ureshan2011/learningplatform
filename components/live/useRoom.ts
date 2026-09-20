"use client";

import { useEffect, useRef, useState } from "react";
import {
  ref,
  onValue,
  push,
  set,
  update,
  serverTimestamp,
  onDisconnect,
  query,
  limitToLast,
  type Database,
} from "firebase/database";
import { clientRtdb } from "@/lib/firebase/client";
import { publicEnv } from "@/lib/env";

/**
 * The live room, as the browser sees it.
 *
 * Everything in here is Realtime Database and none of it is Firestore. That
 * is a cost decision the codebase makes twice over (CLAUDE.md rules 2 and 3):
 * a 1,000-student chat on Firestore would exhaust the daily free quota in one
 * class, and a client subscribed to a Firestore collection bills per document
 * per change. RTDB bills per GB, and chat text is tiny.
 *
 * Every write a student makes here is one the rules already allow — their own
 * chat line, their own presence, their own hand, their own answer once.
 * `quiz`, `leaderboard` and `stats` are read-only to the browser; they come
 * from the teacher's route in `lib/live/arena.ts`.
 *
 * The rules also describe a `reactions` node, and nothing here writes it. That
 * is deliberate rather than unfinished: its shape is `{ emoji, at }`, and the
 * design system forbids emoji outright (CLAUDE.md, rule 6). Reworking it into
 * icon names would be a design decision worth making on purpose, with the
 * teacher, rather than smuggled in because a node exists. The node is
 * harmless where it is.
 */

export interface ChatLine {
  id: string;
  uid: string;
  name: string;
  text: string;
  at: number;
}

export interface LiveQuiz {
  id: string;
  questionId: string;
  text: string;
  options: string[];
  startedAt: number;
  durationSeconds: number;
  state: "open" | "closed";
  /** Present only once the teacher has closed it. */
  correctIndex?: number;
  explanation?: string;
}

export interface BoardRow {
  rank: number;
  uid: string;
  name: string;
  points: number;
}

export interface QuizStats {
  quizId: string;
  answered: number;
  counts: number[];
  correctIndex: number;
}

export interface RaisedHand {
  uid: string;
  question: string;
  at: number;
}

/** The last 60 lines. A student arriving late wants the thread, not the archive. */
const CHAT_WINDOW = 60;

function db(): Database | null {
  // The database URL is deliberately never guessed (CLAUDE.md rule 7) — only
  // us-central1 uses `.firebaseio.com`. An empty value means live classes are
  // not configured, and the arena renders as "not set up" rather than pointing
  // at a database that does not exist and failing silently.
  if (!publicEnv.firebase.databaseURL) return null;
  try {
    return clientRtdb();
  } catch {
    return null;
  }
}

export function useLiveRoom(sessionId: string, me: { uid: string; name: string }) {
  // Not state: this is a build-time constant either way, so there is nothing
  // to discover on mount and nothing to re-render for.
  const configured = Boolean(publicEnv.firebase.databaseURL);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [quiz, setQuiz] = useState<LiveQuiz | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [hands, setHands] = useState<RaisedHand[]>([]);
  const [present, setPresent] = useState(0);
  const database = useRef<Database | null>(null);

  useEffect(() => {
    const instance = db();
    if (!instance) return;
    database.current = instance;
    const base = `live/${sessionId}`;

    // Presence, with the disconnect handler registered before the write —
    // registering it after means a tab closed in the gap leaves a ghost in the
    // room forever.
    const mine = ref(instance, `${base}/presence/${me.uid}`);
    void onDisconnect(mine).remove();
    void set(mine, { name: me.name, at: serverTimestamp() });

    const unsubscribers = [
      onValue(query(ref(instance, `${base}/chat`), limitToLast(CHAT_WINDOW)), (snap) => {
        const value = (snap.val() ?? {}) as Record<string, Omit<ChatLine, "id">>;
        setChat(
          Object.entries(value)
            .map(([id, line]) => ({ id, ...line }))
            .sort((a, b) => a.at - b.at),
        );
      }),
      onValue(ref(instance, `${base}/quiz`), (snap) => {
        setQuiz((snap.val() as LiveQuiz | null) ?? null);
      }),
      onValue(ref(instance, `${base}/leaderboard`), (snap) => {
        setBoard((snap.val() as BoardRow[] | null) ?? []);
      }),
      onValue(ref(instance, `${base}/stats`), (snap) => {
        setStats((snap.val() as QuizStats | null) ?? null);
      }),
      onValue(ref(instance, `${base}/hands`), (snap) => {
        const value = (snap.val() ?? {}) as Record<string, { question: string; at: number }>;
        setHands(
          Object.entries(value)
            .map(([uid, hand]) => ({ uid, ...hand }))
            .sort((a, b) => a.at - b.at),
        );
      }),
      onValue(ref(instance, `${base}/presence`), (snap) => {
        setPresent(snap.size);
      }),
    ];

    return () => {
      for (const off of unsubscribers) off();
      void set(mine, null);
    };
  }, [sessionId, me.uid, me.name]);

  return {
    configured,
    chat,
    quiz,
    board,
    stats,
    hands,
    present,

    /**
     * Sends a chat line.
     *
     * One multi-path update, not two writes, and that is load-bearing. The
     * rule in `database.rules.json` demands both that the message's own `at`
     * equals the server's `now` *and* that `rate/{uid}` equals the same `now`,
     * while the pre-write value of `rate/{uid}` is at least five seconds old.
     * Written separately, the rate stamp resolves to an earlier server clock
     * than the message does, the second condition can never hold, and every
     * line is rejected. Sent together they resolve to one `now`.
     *
     * That is what makes the five-second throttle unbypassable: it is checked
     * against the server's clock, so a client with a helpful one gains
     * nothing.
     */
    async say(text: string) {
      const instance = database.current;
      const trimmed = text.trim().slice(0, 200);
      if (!instance || !trimmed) return;

      const base = `live/${sessionId}`;
      // A key generated locally, so both paths can name it in one update.
      const key = push(ref(instance, `${base}/chat`)).key;
      if (!key) return;

      await update(ref(instance, base), {
        [`rate/${me.uid}`]: serverTimestamp(),
        [`chat/${key}`]: {
          uid: me.uid,
          name: me.name,
          text: trimmed,
          at: serverTimestamp(),
        },
      });
    },

    async raiseHand(question: string) {
      const instance = database.current;
      const trimmed = question.trim().slice(0, 300);
      if (!instance || !trimmed) return;
      await set(ref(instance, `live/${sessionId}/hands/${me.uid}`), {
        question: trimmed,
        at: Date.now(),
      });
    },

    async lowerHand() {
      const instance = database.current;
      if (!instance) return;
      await set(ref(instance, `live/${sessionId}/hands/${me.uid}`), null);
    },

    /**
     * Answers the open question. The rules allow exactly one write per student
     * per quiz and no overwrite, so a second tap is rejected by the database
     * rather than by this function being polite about it.
     *
     * Takes the question's start time and reads the clock here rather than
     * taking an elapsed figure from the component — this module is not a
     * component, so the clock read belongs on this side of the boundary.
     * The value is a speed bonus in a class game and is clamped server-side
     * against the question's own window, so it is not trusted for anything
     * that affects a mark.
     */
    async answer(quizId: string, choice: number, startedAt: number) {
      const instance = database.current;
      if (!instance) return;
      await set(ref(instance, `live/${sessionId}/answers/${quizId}/${me.uid}`), {
        choice,
        msSinceShown: Math.max(0, Math.round(Date.now() - startedAt)),
      });
    },
  };
}
