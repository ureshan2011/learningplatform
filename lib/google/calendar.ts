import "server-only";

import { randomBytes } from "node:crypto";
import { accessToken } from "@/lib/google/oauth";
import { recordGoogleError } from "@/lib/google/settings";

/**
 * Google Calendar events with Google Meet links, on the connected account's
 * primary calendar.
 *
 * A Meet link is created by asking Calendar for an event with a
 * `conferenceData.createRequest` — the documented way, and the one that works
 * for a personal Gmail account as well as Workspace. The owner gets each class
 * and consultation in their own calendar, with Google's reminders, for free.
 *
 * ## Idempotent by event id
 *
 * The caller chooses the event id and stores it *before* calling. If the
 * process dies after Google created the event but before the link was saved,
 * the retry inserts the same id, Google answers 409, and the existing event —
 * link included — is read back. One class never gets two Meets.
 */

const EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** Calendar event ids are base32hex: lowercase a–v and digits, 5 to 1024 characters. */
const BASE32HEX = "0123456789abcdefghijklmnopqrstuv";

export function newEventId(prefix = "ict"): string {
  const bytes = randomBytes(20);
  let id = prefix.replace(/[^0-9a-v]/g, "");
  for (const b of bytes) id += BASE32HEX[b % 32];
  return id;
}

export interface MeetEvent {
  eventId: string;
  /** Null while Google is still creating the conference — read it again shortly. */
  meetUrl: string | null;
  htmlLink?: string;
  status?: string;
}

interface CalendarEvent {
  id: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: { status?: { statusCode?: string } };
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
}

function meetUrlOf(event: CalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink;
  const video = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return video?.uri ?? null;
}

function toMeetEvent(event: CalendarEvent): MeetEvent {
  return { eventId: event.id, meetUrl: meetUrlOf(event), htmlLink: event.htmlLink, status: event.status };
}

async function call(path: string, init: RequestInit): Promise<Response> {
  const token = await accessToken();
  return fetch(path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
}

async function failure(res: Response, what: string): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  const message = `${what}: ${body.error?.message ?? res.statusText} (${res.status})`;
  await recordGoogleError(message);
  return new Error(message);
}

/**
 * Creates (or, on a retry, finds) an event with a Meet link.
 *
 * Times are given as instants and labelled Asia/Colombo, so the owner's
 * calendar in Auckland shows the right local time through both daylight-saving
 * changes without this code knowing about either.
 */
export async function createMeetEvent(params: {
  eventId: string;
  summary: string;
  description: string;
  startsAt: number;
  durationMinutes: number;
}): Promise<MeetEvent> {
  const body = {
    id: params.eventId,
    summary: params.summary,
    description: params.description,
    start: { dateTime: new Date(params.startsAt).toISOString(), timeZone: "Asia/Colombo" },
    end: {
      dateTime: new Date(params.startsAt + params.durationMinutes * 60 * 1000).toISOString(),
      timeZone: "Asia/Colombo",
    },
    // Nobody is invited by email — students sign in with a phone number and
    // receive the link inside the app, after the access check.
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: false,
    reminders: { useDefault: true },
    conferenceData: {
      createRequest: { requestId: params.eventId, conferenceSolutionKey: { type: "hangoutsMeet" } },
    },
  };

  const res = await call(`${EVENTS}?conferenceDataVersion=1&sendUpdates=none`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    // Already created by an earlier attempt that did not get to save the link.
    const existing = await getEvent(params.eventId);
    if (existing) return existing;
  }
  if (!res.ok) throw await failure(res, "Could not create the Google Meet");
  return toMeetEvent((await res.json()) as CalendarEvent);
}

export async function getEvent(eventId: string): Promise<MeetEvent | null> {
  const res = await call(`${EVENTS}/${encodeURIComponent(eventId)}`, { method: "GET" });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw await failure(res, "Could not read the Google Calendar event");
  return toMeetEvent((await res.json()) as CalendarEvent);
}

/** Removes an event from the owner's calendar. Already gone counts as done. */
export async function deleteEvent(eventId: string): Promise<void> {
  const res = await call(`${EVENTS}/${encodeURIComponent(eventId)}?sendUpdates=none`, { method: "DELETE" });
  if (res.ok || res.status === 404 || res.status === 410) return;
  throw await failure(res, "Could not remove the Google Calendar event");
}

/** A cheap call that proves the connection works — one event read from the calendar. */
export async function checkCalendarAccess(): Promise<void> {
  const params = new URLSearchParams({ maxResults: "1", timeMin: new Date().toISOString() });
  const res = await call(`${EVENTS}?${params.toString()}`, { method: "GET" });
  if (!res.ok) throw await failure(res, "Google Calendar did not answer");
}
