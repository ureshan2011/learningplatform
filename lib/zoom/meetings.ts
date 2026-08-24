import "server-only";

import { zoomFetch } from "@/lib/zoom/client";
import { requireServerEnv } from "@/lib/env";

export interface ZoomMeeting {
  id: number;
  join_url: string;
  start_url: string;
  registration_url?: string;
}

export interface ZoomRegistrant {
  id: string;
  registrant_id: string;
  /** Unique per student — this is the anti-sharing mechanism. */
  join_url: string;
}

/**
 * Creates the meeting that hosts a class.
 *
 * Registration is REQUIRED, which is what lets us mint a distinct join URL per
 * student. A shared link then means two people fighting over one seat, and
 * Zoom's participant report names exactly whose link leaked.
 */
export async function createClassMeeting(params: {
  topic: string;
  startsAt: number;
  durationMinutes: number;
}): Promise<ZoomMeeting> {
  const hostUserId = requireServerEnv("ZOOM_HOST_USER_ID");

  return zoomFetch<ZoomMeeting>(`/users/${encodeURIComponent(hostUserId)}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // scheduled
      start_time: new Date(params.startsAt).toISOString(),
      duration: params.durationMinutes,
      timezone: "Asia/Colombo",
      settings: {
        // 2 = automatically approve; we have already checked payment ourselves.
        approval_type: 2,
        registration_type: 1,
        join_before_host: false,
        waiting_room: false,
        // Students are muted on entry and cannot unmute themselves: a mass
        // class with open mics is unteachable. Questions go through the Live
        // Arena's Raise Hand instead.
        mute_upon_entry: true,
        participant_video: false,
        host_video: true,
        auto_recording: "cloud",
        meeting_authentication: false,
      },
    }),
  });
}

/**
 * Registers one student and returns their personal join URL.
 *
 * The name is forced to `Student Name | 077 ••• 4567` so the Zoom participant
 * list, the recording and any screenshot all carry an identity.
 */
export async function registerStudent(params: {
  meetingId: string;
  studentName: string;
  maskedPhone: string;
  email: string;
}): Promise<ZoomRegistrant> {
  const [firstName, ...rest] = params.studentName.trim().split(/\s+/);

  return zoomFetch<ZoomRegistrant>(`/meetings/${params.meetingId}/registrants`, {
    method: "POST",
    body: JSON.stringify({
      first_name: `${firstName || "Student"} ${rest.join(" ")}`.trim(),
      last_name: `| ${params.maskedPhone}`,
      email: params.email,
    }),
  });
}

export async function endMeeting(meetingId: string): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ action: "end" }),
  });
}

/**
 * Points the meeting's simulcast at an RTMP destination (YouTube Live).
 *
 * This is what decouples class size from the Zoom licence: the Zoom room holds
 * the paid seats, and everyone beyond it — plus every mobile student — watches
 * the simulcast inside our own player, with the full Live Arena beside it.
 * Requires Zoom Pro or above with Custom Live Streaming Service enabled.
 */
export async function configureSimulcast(params: {
  meetingId: string;
  streamUrl: string;
  streamKey: string;
  pageUrl: string;
}): Promise<void> {
  await zoomFetch(`/meetings/${params.meetingId}/livestream`, {
    method: "PATCH",
    body: JSON.stringify({
      stream_url: params.streamUrl,
      stream_key: params.streamKey,
      page_url: params.pageUrl,
    }),
  });
}
