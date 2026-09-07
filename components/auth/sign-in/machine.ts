/**
 * The sign-in state machine.
 *
 * One reducer, one `phase`, one `notice`. Rendering is a pure function of this
 * state, so a contradictory screen — "wrong code" beside a signed-in success —
 * cannot happen: every action replaces whatever notice was showing, and there
 * is exactly one slot for it. See docs/auth-redesign-handoff.md §3.2.
 */

export interface BoundDeviceView {
  label: string;
  lastSeenAt: number;
}

export type Phase =
  | { kind: "restoring" }
  | { kind: "phone" }
  | { kind: "sending" }
  | { kind: "code"; status: "waiting" | "verifying" | "opening" }
  | { kind: "name" }
  | {
      kind: "device_limit";
      devices: BoundDeviceView[];
      canSwap: boolean;
      swapAvailableAt?: number;
    }
  | { kind: "done" };

export type NoticeTone = "info" | "warning" | "danger" | "success";
export type Notice = { tone: NoticeTone; text: string } | null;

export interface Send {
  /** Firebase's verification id for one SMS send. Redeemed with a 6-digit code via PhoneAuthProvider.credential. */
  verificationId: string;
  sentAt: number;
}

/** How many sends are kept and tried against an entered code, newest first. */
export const MAX_SENDS_KEPT = 3;

export interface Attempt {
  /** E.164. */
  phone: string;
  /** Oldest first, capped at MAX_SENDS_KEPT. */
  sends: Send[];
  wrongAttempts: number;
}

export interface State {
  phase: Phase;
  notice: Notice;
  attempt: Attempt | null;
  /**
   * A secondary action in flight: resend, device swap, save-name. Primary
   * send/verify/open progress is carried by `phase` itself (`sending`,
   * `code.status`), so this only ever gates a button beside the main flow.
   */
  busy: boolean;
}

export type Action =
  | { type: "RESTORE_TO_PHONE" }
  | { type: "RESTORE_ATTEMPT"; attempt: Attempt }
  | { type: "SEND_START" }
  | { type: "SEND_SUCCESS"; phone: string; verificationId: string; sentAt: number }
  | { type: "SEND_FAILURE"; notice: Notice }
  | { type: "RESEND_START" }
  | { type: "RESEND_SUCCESS"; verificationId: string; sentAt: number; notice: Notice }
  | { type: "RESEND_FAILURE"; notice: Notice }
  | { type: "VERIFY_START" }
  | { type: "VERIFY_WRONG"; notice: Notice }
  | { type: "VERIFY_ERROR"; notice: Notice }
  | { type: "OPEN_START" }
  | {
      type: "OPEN_DEVICE_LIMIT";
      devices: BoundDeviceView[];
      canSwap: boolean;
      swapAvailableAt?: number;
    }
  | { type: "OPEN_ACCOUNT_DISABLED"; notice: Notice }
  | { type: "OPEN_FAILED"; notice: Notice }
  | { type: "OPEN_NEW_USER" }
  | { type: "OPEN_DONE" }
  | { type: "SWAP_START" }
  | { type: "SWAP_FAILED"; notice: Notice }
  | { type: "DEVICE_LIMIT_BACK" }
  | { type: "NAME_START" }
  | { type: "NAME_FAILED"; notice: Notice }
  | { type: "NAME_DONE" }
  | { type: "CHANGE_NUMBER" };

export function initialState(restoring: boolean): State {
  return {
    phase: restoring ? { kind: "restoring" } : { kind: "phone" },
    notice: null,
    attempt: null,
    busy: false,
  };
}

function appendSend(attempt: Attempt, send: Send): Attempt {
  return { ...attempt, sends: [...attempt.sends, send].slice(-MAX_SENDS_KEPT) };
}

export function signInReducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESTORE_TO_PHONE":
      return state.phase.kind === "restoring" ? { ...state, phase: { kind: "phone" } } : state;

    case "RESTORE_ATTEMPT":
      return {
        ...state,
        phase: { kind: "code", status: "waiting" },
        attempt: action.attempt,
        notice: null,
      };

    case "SEND_START":
      return { ...state, phase: { kind: "sending" }, notice: null };

    case "SEND_SUCCESS":
      return {
        ...state,
        phase: { kind: "code", status: "waiting" },
        notice: null,
        attempt: { phone: action.phone, sends: [{ verificationId: action.verificationId, sentAt: action.sentAt }], wrongAttempts: 0 },
      };

    case "SEND_FAILURE":
      return { ...state, phase: { kind: "phone" }, notice: action.notice };

    case "RESEND_START":
      return { ...state, busy: true, notice: null };

    case "RESEND_SUCCESS":
      return {
        ...state,
        busy: false,
        phase: { kind: "code", status: "waiting" },
        attempt: state.attempt
          ? { ...appendSend(state.attempt, { verificationId: action.verificationId, sentAt: action.sentAt }), wrongAttempts: 0 }
          : state.attempt,
        notice: action.notice,
      };

    case "RESEND_FAILURE":
      return { ...state, busy: false, notice: action.notice };

    case "VERIFY_START":
      return { ...state, phase: { kind: "code", status: "verifying" }, notice: null };

    case "VERIFY_WRONG":
      return {
        ...state,
        phase: { kind: "code", status: "waiting" },
        notice: action.notice,
        attempt: state.attempt ? { ...state.attempt, wrongAttempts: state.attempt.wrongAttempts + 1 } : null,
      };

    case "VERIFY_ERROR":
      return { ...state, phase: { kind: "code", status: "waiting" }, notice: action.notice };

    case "OPEN_START":
      return { ...state, phase: { kind: "code", status: "opening" }, notice: null };

    case "OPEN_DEVICE_LIMIT":
      return {
        ...state,
        phase: {
          kind: "device_limit",
          devices: action.devices,
          canSwap: action.canSwap,
          swapAvailableAt: action.swapAvailableAt,
        },
        busy: false,
        notice: null,
      };

    case "OPEN_ACCOUNT_DISABLED":
      return { ...state, phase: { kind: "code", status: "waiting" }, notice: action.notice };

    case "OPEN_FAILED":
      return { ...state, phase: { kind: "code", status: "waiting" }, notice: action.notice };

    case "OPEN_NEW_USER":
      return { ...state, phase: { kind: "name" }, notice: null };

    case "OPEN_DONE":
      return { ...state, phase: { kind: "done" }, notice: null };

    case "SWAP_START":
      return { ...state, busy: true, notice: null };

    case "SWAP_FAILED":
      return { ...state, busy: false, notice: action.notice };

    case "DEVICE_LIMIT_BACK":
      return { ...state, phase: { kind: "code", status: "waiting" }, notice: null, busy: false };

    case "NAME_START":
      return { ...state, busy: true, notice: null };

    case "NAME_FAILED":
      return { ...state, busy: false, notice: action.notice };

    case "NAME_DONE":
      return { ...state, busy: false, phase: { kind: "done" } };

    case "CHANGE_NUMBER":
      return { ...state, phase: { kind: "phone" }, attempt: null, notice: null, busy: false };

    default:
      return state;
  }
}
