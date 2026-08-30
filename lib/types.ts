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
   * Syllabus unit this class teaches, when the teacher picked one while
   * scheduling. Optional so every class scheduled before this field existed
   * still loads — those fall back to matching on `topic`/`title` text.
   *
   * This is what lets the public syllabus page put a real "join this class"
   * button beside the exact competency a student is looking at, instead of one
   * generic sign-up button for the whole subject.
   */
  unitId?: string;
  /** Competency level within that unit, e.g. "3.2". Narrower than `unitId`. */
  lessonId?: string;

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

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "chargeback"
  | "refunded";

/** Card through PayHere, an uploaded deposit slip, or cash/transfer the teacher recorded. */
export type PaymentProvider = "payhere" | "bank_slip" | "manual";

export interface Payment {
  id: string;
  tenantId: TenantId;
  uid: string;
  subjectId: string;
  provider: PaymentProvider;
  amountLKR: number;
  status: PaymentStatus;
  /** Billing period this payment buys. */
  periodStart: number;
  periodEnd: number;
  /**
   * Sequential receipt number, e.g. "ICT-2026-0007".
   *
   * Assigned once, when the payment first becomes `paid`, and never reused or
   * renumbered — an accounting record whose identifiers move is not a record.
   * A payment that is refunded later keeps the number it was issued under, and
   * the refund is a separate line in the ledger.
   */
  receiptNo?: string;
  paidAt?: number;
  /** PayHere's payment_id, for reconciliation against their dashboard. */
  providerRef?: string;
  /** How PayHere says it was paid (VISA, MASTER, ...), straight from the notification. */
  providerMethod?: string;
  /** Bank deposit slip image, awaiting teacher approval. */
  slipUrl?: string;
  /** Bank reference or deposit id the teacher read off the slip, for reconciliation. */
  bankRef?: string;
  /** Free-text note the teacher attached — why an amount differs, who paid in cash. */
  note?: string;
  /** Set on a manually recorded payment: the teacher account that entered it. */
  recordedBy?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  refundedAt?: number;
  refundReason?: string;
  /** True once access bought by this payment has been taken back (refund or chargeback). */
  accessRevoked?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * One raw provider notification, kept exactly as it arrived.
 *
 * The payment document holds the *decision*; this holds the *evidence*. When a
 * student says they paid and the class never unlocked, this is the only record
 * that can say whether PayHere ever called, what it said, and why it was
 * accepted or rejected — including notifications that failed signature
 * verification, which are precisely the ones worth keeping.
 */
export interface PaymentEvent {
  id: string;
  tenantId: TenantId;
  provider: "payhere";
  orderId: string;
  /** "accepted", "bad_signature", "unknown_order", "amount_mismatch", "duplicate". */
  outcome: string;
  statusCode?: string;
  amount?: string;
  currency?: string;
  providerRef?: string;
  /** Every field of the notification, for audit. Never contains card data — PayHere does not send any. */
  raw: Record<string, string>;
  receivedAt: number;
}

/**
 * Business and bank details the platform prints on receipts and shows to
 * students paying by deposit.
 *
 * Stored in Firestore rather than environment variables so the teacher can
 * change a bank account from the browser — the whole platform is set up
 * without a command line, and a bank account is exactly the kind of thing that
 * changes at short notice.
 */
export interface PaymentSettings {
  tenantId: TenantId;
  /** Printed on receipts. A registered business name if there is one, otherwise the teacher's own name. */
  businessName: string;
  ownerName: string;
  addressLine: string;
  contactPhone: string;
  contactEmail: string;
  /** Business Registration number, once registered. Blank is fine — receipts simply omit the line. */
  brNumber?: string;
  /** Taxpayer Identification Number from the IRD, if registered. */
  taxId?: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  /** Anything else a depositor must do — e.g. "put your phone number as the reference". */
  slipInstructions?: string;

  /**
   * PayHere credentials, entered in the console rather than deployed as
   * environment variables.
   *
   * Environment variables are the safer home for a secret and stay supported —
   * they win when present. But setting one on App Hosting means Secret Manager
   * and a command line, and this platform's owner has neither, which in
   * practice meant card payments could never be switched on at all. Here they
   * can, from a phone. The secret is never sent to a browser and the document
   * is server-read only (see firestore.rules).
   */
  payhereMerchantId?: string;
  payhereMerchantSecret?: string;
  payhereMode?: "sandbox" | "live";

  updatedAt: number;
  updatedBy?: string;
}

export type ContentKind = "notes" | "past_paper" | "marking_scheme" | "replay";

/**
 * One official syllabus competency level, nested inside its `Unit` document
 * rather than living in its own collection — ~80 of these across A/L ICT,
 * and they change together (a syllabus revision touches a whole unit), so one
 * read per unit beats 80 per-lesson documents. `content` is deliberately
 * optional: this type ships with objectives and exam guidance only, full
 * teaching content is added later without a schema change.
 */
export interface Lesson {
  /** The syllabus competency-level number, e.g. "1.1". Stable across re-seeding. */
  id: string;
  order: number;
  title: string;
  /** Recommended teaching periods (40 min each), from the syllabus's own allocation table. */
  periods: number;
  /** What a student must be able to do to answer exam questions on this competency level. */
  examObjectives: string[];
  /** Where marks concentrate in Paper I/II — drawn from the syllabus's period-weighting and known paper structure, not a substitute for checking recent past papers. */
  importantAreas: string[];
  /** Full lesson content (notes, slides, activities). Absent until authored. */
  content?: string;
}

/**
 * One official syllabus unit (a "Competency" in NIE's own terms) for a
 * subject — the A/L ICT syllabus has 14, grades 12 and 13 combined.
 */
export interface Unit {
  id: string;
  tenantId: TenantId;
  subjectId: string;
  order: number;
  /** The NIE competency number this unit corresponds to, e.g. 7 for "System Analysis and Design". */
  competencyNumber: number;
  /** Which year of the two-year A/L syllabus this unit is taught in. */
  gradeYear: 12 | 13;
  title: string;
  /** The full "Explores ... / Uses ... / Designs ..." competency statement from the syllabus. */
  competencyStatement: string;
  periods: number;
  lessons: Lesson[];
  createdAt: number;
}

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

/**
 * A fixed, timed paper — the digital equivalent of a Sri Lankan "paper
 * class": a real past-paper-style sitting with negative marking, not
 * self-paced practice. `questionIds` is a snapshot chosen at creation time
 * so every student who sits it gets the exact same paper, and it stays
 * reproducible even if the question bank changes later.
 */
export interface MockExam {
  id: string;
  tenantId: TenantId;
  subjectId: string;
  title: string;
  questionIds: string[];
  durationMinutes: number;
  /** Fraction deducted per wrong answer (e.g. 0.33 = -1/3). 0 = no negative marking. */
  negativeMarking: number;
  active: boolean;
  createdAt: number;
  createdBy: string;
}

/**
 * One student's sitting of one mock exam. Deterministic id
 * `${uid}_${mockExamId}` for the same reason enrollment ids are — starting
 * and submitting are both single-document operations, never a query.
 *
 * `questionOrder` is shuffled once, on first start, and reused on every
 * later read (page refresh mid-exam) so the paper does not reshuffle under
 * a student who reloads. Scoring fields are undefined until `submittedAt`
 * is set; once set, the attempt is locked — see `submitMockExam`.
 */
export interface MockExamAttempt {
  id: string;
  tenantId: TenantId;
  uid: string;
  subjectId: string;
  mockExamId: string;
  questionOrder: string[];
  startedAt: number;
  submittedAt?: number;
  answers?: Record<string, number>;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  topicBreakdown?: Record<string, { correct: number; total: number }>;
  rank?: number;
  totalAttempts?: number;
  percentile?: number;
  updatedAt: number;
}

/**
 * An email captured from the free content hub on the landing page — SEO
 * traffic that isn't a student account yet. Deliberately separate from
 * `User`: most of these people will never sign in with a phone number at
 * all, so this is a mailing list, not a partial account.
 *
 * Doc id is the lowercased, trimmed email itself: a repeat signup just
 * refreshes `updatedAt` instead of creating a duplicate, and it makes an
 * existence check a single get rather than a query.
 */
export interface Lead {
  id: string;
  tenantId: TenantId;
  email: string;
  /** Where the signup happened, e.g. "landing_hero", "landing_resources". */
  source: string;
  createdAt: number;
  updatedAt: number;
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
