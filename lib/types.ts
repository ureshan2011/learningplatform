/**
 * Domain model for the platform.
 *
 * Every collection carries `tenantId`. It stays "default" through Phase 1-3;
 * it exists now so Phase 4 (other teachers running classes on the platform for
 * a revenue cut) does not require a data migration.
 */

export type TenantId = string;

export type Role = "student" | "teacher" | "parent" | "admin";
export type Medium = "sinhala" | "english" | "tamil";
export type Grade = "OL" | "AL";

/** Max devices one account may be bound to. Raising this raises piracy. */
export const MAX_DEVICES_PER_USER = 2;

export interface BoundDevice {
  /** Stable hash of coarse device characteristics — never raw fingerprint data. */
  deviceHash: string;
  label: string;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface User {
  uid: string;
  tenantId: TenantId;
  role: Role;
  name: string;
  /** E.164, e.g. +94771234567. The identity anchor — one account per number. */
  phone: string;
  medium: Medium;
  school?: string;
  district?: string;
  devices: BoundDevice[];
  /** Set on a student to expose their progress to a parent account. */
  parentUid?: string;
  /** Set on a parent to list the students they may view. */
  childUids?: string[];
  referralCode: string;
  referredBy?: string;
  /** Set once the referrer + referred pair have both received their bonus days. Blocks double-claiming on renewal. */
  referralRewarded?: boolean;
  /** Bumped to invalidate every parent view link issued before the bump. */
  parentLinkVersion?: number;
  createdAt: number;
  disabled?: boolean;
}

export interface Subject {
  id: string;
  tenantId: TenantId;
  name: string;
  grade: Grade;
  medium: Medium;
  /** Monthly fee in LKR rupees (not cents — PayHere takes rupees). */
  priceLKR: number;
  description: string;
  syllabusTopics: string[];
  active: boolean;
}

export type EnrollmentStatus = "active" | "expired" | "pending_payment" | "suspended";

export interface Enrollment {
  /** Deterministic id: `${uid}_${subjectId}` — makes access lookups a single get. */
  id: string;
  tenantId: TenantId;
  uid: string;
  subjectId: string;
  status: EnrollmentStatus;
  /** Access is granted while now <= currentPeriodEnd. */
  currentPeriodStart: number;
  currentPeriodEnd: number;
  source: "payhere" | "bank_slip" | "manual" | "trial" | "free_trial";
  lastPaymentId?: string;
  createdAt: number;
  updatedAt: number;
}

export type SessionState = "scheduled" | "live" | "ended" | "cancelled";

export interface ClassSession {
  id: string;
  tenantId: TenantId;
  subjectId: string;
  title: string;
  topic: string;
  startsAt: number;
  durationMinutes: number;
  state: SessionState;

  /**
   * Zoom meeting hosting the interactive room.
   *
   * The host `start_url` is deliberately NOT stored here: this document is
   * readable by every signed-in student so they can see the timetable, and a
   * start URL grants host control of the class. It lives in `sessionSecrets`,
   * which no client rule grants access to.
   */
  zoomMeetingId?: string;

  /**
   * HLS playback URL of the RTMP simulcast (YouTube Live unlisted).
   * Serves mobile students and every student beyond the Zoom licence cap,
   * which is what makes class size independent of the Zoom invoice.
   */
  hlsUrl?: string;
  /** Simulcast lags Zoom. Quiz scoring must never use wall-clock. */
  simulcastDelaySeconds?: number;

  replayUrl?: string;
  replayReadyAt?: number;
  createdAt: number;
}

/**
 * Server-only companion to a session. No security rule grants read access to
 * the `sessionSecrets` collection, so these values are reachable only through
 * the Admin SDK.
 */
export interface SessionSecrets {
  sessionId: string;
  /** Grants host control of the meeting. Teacher eyes only. */
  zoomStartUrl: string;
  rtmpStreamKey?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  uid: string;
  tenantId: TenantId;
  joinedAt?: number;
  leftAt?: number;
  minutesPresent: number;
  /** Random in-class "tap within 60s" prompts — proves live presence. */
  pingsSent: number;
  pingsAnswered: number;
  /** 0-100, surfaced on the parent dashboard. */
  attendanceScore: number;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "chargeback";

export interface Payment {
  id: string;
  tenantId: TenantId;
  uid: string;
  subjectId: string;
  provider: "payhere" | "bank_slip";
  amountLKR: number;
  status: PaymentStatus;
  /** Billing period this payment buys. */
  periodStart: number;
  periodEnd: number;
  /** PayHere's payment_id, for reconciliation against their dashboard. */
  providerRef?: string;
  /** Bank deposit slip in R2, awaiting teacher approval. */
  slipUrl?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export type ContentKind = "notes" | "past_paper" | "marking_scheme" | "replay";

export interface ContentItem {
  id: string;
  tenantId: TenantId;
  subjectId: string;
  kind: ContentKind;
  title: string;
  topic?: string;
  /** Object key in Cloudflare R2. Zero egress fees is why media never sits in Firebase Storage. */
  r2Key: string;
  sizeBytes?: number;
  /** Public items are indexable and power the free SEO acquisition channel. */
  isPublic: boolean;
  slug?: string;
  createdAt: number;
}

export interface Progress {
  uid: string;
  subjectId: string;
  tenantId: TenantId;
  xp: number;
  level: number;
  streakDays: number;
  /** Grace days absorb one sick day. A streak that snaps makes students quit. */
  streakGraceRemaining: number;
  lastActiveDay?: string;
  weakTopics: string[];
  /** 0-1 churn risk. Drives the nudge before a parent cancels. */
  riskScore: number;
  updatedAt: number;
}

export type QuestionSource = "past_paper" | "original" | "command_word_drill";

/**
 * One practice/revision question.
 *
 * Written only by the teacher console (seed script or future authoring UI),
 * never by students — same posture as `content`. `misconceptions` is what
 * turns a mark into a diagnosis: keyed by the wrong option's index, it names
 * the specific misunderstanding that choice usually reveals, so a wrong
 * answer teaches something instead of just costing a point.
 */
export interface Question {
  id: string;
  tenantId: TenantId;
  subjectId: string;
  topic: string;
  medium: Medium;
  commandWord?: string;
  source: QuestionSource;
  year?: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptions?: Record<number, string>;
  active: boolean;
  createdAt: number;
}

/**
 * One student's spaced-repetition state for one question.
 *
 * Deterministic id `${uid}_${questionId}` for the same reason enrollment ids
 * are deterministic: the hot path (recording an answer) is a single document
 * read, never a query.
 */
export interface QuestionAttempt {
  id: string;
  uid: string;
  tenantId: TenantId;
  subjectId: string;
  questionId: string;
  topic: string;
  timesSeen: number;
  timesCorrect: number;
  /** SM-2 ease factor, clamped >= 1.3. */
  easeFactor: number;
  intervalDays: number;
  dueAt: number;
  lastChoice: number;
  lastCorrect: boolean;
  lastAnsweredAt: number;
}

/** Result of the single server-side access check. */
export interface AccessResult {
  allowed: boolean;
  reason?:
    | "not_authenticated"
    | "not_enrolled"
    | "expired"
    | "suspended"
    | "device_limit"
    | "account_disabled";
  enrollment?: Enrollment;
}
