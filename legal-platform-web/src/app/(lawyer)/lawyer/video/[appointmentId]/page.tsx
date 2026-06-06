"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Check, Copy, PhoneOff, Video } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { UserResponse } from "@/types/user";
import type { VideoSessionResponseDTO } from "@/types/video";

// Shape of the Jitsi External API constructor exposed on window
declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: Record<string, unknown>
    ) => JitsiAPI;
  }
}
interface JitsiAPI {
  addEventListener(event: string, handler: (e: Record<string, unknown>) => void): void;
  executeCommand(command: string, ...args: unknown[]): void;
  dispose(): void;
}

export default function LawyerVideoPage() {
  const params             = useParams<{ appointmentId: string }>();
  const { data: authData } = useSession();

  const [client,     setClient]     = useState<UserResponse | null>(null);
  const [session,    setSession]    = useState<VideoSessionResponseDTO | null>(null);
  const [joined,     setJoined]     = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef       = useRef<JitsiAPI | null>(null);

  // ── Load appointment + session data ────────────────────────────────────────
  useEffect(() => {
    if (!params.appointmentId) return;
    let cancelled = false;

    (async () => {
      try {
        const name = encodeURIComponent(authData?.user?.name ?? "Lawyer");
        const uid  = encodeURIComponent(authData?.user?.email ?? "lawyer");
        const mail = encodeURIComponent(authData?.user?.email ?? "");
        const [apptData, sessData] = await Promise.all([
          apiFetch<AppointmentResponseDTO>(`/appointments/${params.appointmentId}`),
          apiFetch<VideoSessionResponseDTO>(
            `/video-sessions/appointment/${params.appointmentId}?moderator=true&displayName=${name}&userId=${uid}&email=${mail}`
          ),
        ]);
        const clientData = await apiFetch<UserResponse>(`/users/${apptData.clientId}`).catch(() => null);
        if (!cancelled) { setSession(sessData); setClient(clientData); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load video session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [params.appointmentId]);

  // ── Start/join the session via the REST API ─────────────────────────────────
  async function joinSession() {
    if (!params.appointmentId) return;
    try {
      const name = encodeURIComponent(authData?.user?.name ?? "Lawyer");
      const uid  = encodeURIComponent(authData?.user?.email ?? "lawyer");
      const mail = encodeURIComponent(authData?.user?.email ?? "");
      const updated = await apiFetch<VideoSessionResponseDTO>(
        `/video-sessions/appointment/${params.appointmentId}/join?moderator=true&displayName=${name}&userId=${uid}&email=${mail}`,
        { method: "POST" }
      );
      setSession(updated);
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start video session.");
    }
  }

  // ── Mount the Jitsi External API once the user has clicked "Start" ─────────
  useEffect(() => {
    if (!joined || !session || !containerRef.current) return;

    const meetUrl  = new URL(session.meetingUrl);
    const domain   = meetUrl.hostname;          // "8x8.vc" for JaaS
    // For JaaS the room name must include the tenant: "<appId>/<room>"
    // The meeting URL path is "/<appId>/<room>" — strip the leading "/".
    const roomName = meetUrl.pathname.replace(/^\//, "");
    const displayName = authData?.user?.name ?? "Lawyer";

    function initJitsi() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        // JaaS JWT — moderator=true so the lawyer auto-hosts the meeting.
        ...(session.jitsiToken ? { jwt: session.jitsiToken } : {}),
        parentNode:   containerRef.current,
        width:        "100%",
        height:       "100%",
        configOverwrite: {
          prejoinPageEnabled:   false,   // skip the Jitsi pre-join lobby screen
          disableDeepLinking:   true,
          enableWelcomePage:    false,
          startWithAudioMuted:  false,
          startWithVideoMuted:  false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK:    false,
          MOBILE_APP_PROMO:        false,
          HIDE_DEEP_LINKING_LOGO:  true,
          SHOW_BRAND_WATERMARK:    false,
        },
        userInfo: { displayName },
      });

      // The very instant the lawyer is granted moderator role, disable the
      // lobby so the client can join without waiting for approval.
      api.addEventListener("participantRoleChanged", (event) => {
        if (event["role"] === "moderator") {
          // false = disable lobby
          api.executeCommand("toggleLobby", false);
        }
      });

      apiRef.current = api;
    }

    // Load the External API script once; reuse if already present.
    const scriptSrc = `https://${domain}/external_api.js`;
    const existing  = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else if (existing) {
      existing.addEventListener("load", initJitsi);
    } else {
      const script    = document.createElement("script");
      script.src      = scriptSrc;
      script.onload   = initJitsi;
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  async function endSession() {
    apiRef.current?.dispose();
    apiRef.current = null;
    if (params.appointmentId) {
      await apiFetch(`/video-sessions/appointment/${params.appointmentId}/end`, {
        method: "POST",
      }).catch(() => {});
    }
  }

  async function copyLink() {
    if (!session?.meetingUrl) return;
    await navigator.clipboard.writeText(session.meetingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading video session…</div>;
  }
  if (error || !session) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this video session."}
      </div>
    );
  }

  // ── Pre-join screen ─────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-blue-100">
          <Video className="size-10 text-blue-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Start Video Session</h1>
          <p className="mt-2 text-sm text-gray-500">
            You&apos;re about to start a consultation with{" "}
            {client?.fullName ?? "your client"}.<br />
            You will be the meeting host — clients can join once you start.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-xs text-gray-400">Session link (share with client)</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate font-mono text-xs text-gray-700">
              {session.meetingUrl}
            </p>
            <button
              onClick={() => void copyLink()}
              className="shrink-0 rounded-md border border-gray-200 bg-white p-1.5 hover:bg-gray-100"
            >
              {copied
                ? <Check className="size-3.5 text-green-600" />
                : <Copy className="size-3.5 text-gray-500" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => void joinSession()}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Start Session
        </button>
        <Link
          href="/lawyer/appointments"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="size-4" /> Back to appointments
        </Link>
      </div>
    );
  }

  // ── Live meeting — embedded JaaS iframe via External API ───────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-sm font-medium text-white">Live Session</span>
        </div>
        <span className="text-xs text-gray-400">{client?.fullName ?? "Client"}</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden" />

      <div className="flex items-center justify-center bg-gray-900 py-3">
        <Link
          href="/lawyer/appointments"
          onClick={() => void endSession()}
          className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <PhoneOff className="size-5" />
        </Link>
      </div>
    </div>
  );
}
