"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { VideoSessionResponseDTO } from "@/types/video";

export default function ClientVideoPage() {
  const params = useParams<{ appointmentId: string }>();
  const { data: authData } = useSession();

  const [appointment, setAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [session, setSession] = useState<VideoSessionResponseDTO | null>(null);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.appointmentId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const name = encodeURIComponent(authData?.user?.name ?? "Client");
        const uid  = encodeURIComponent(authData?.user?.email ?? "client");
        const mail = encodeURIComponent(authData?.user?.email ?? "");
        const [appointmentData, sessionData] = await Promise.all([
          apiFetch<AppointmentResponseDTO>(`/appointments/${params.appointmentId}`),
          apiFetch<VideoSessionResponseDTO>(
            `/video-sessions/appointment/${params.appointmentId}?moderator=false&displayName=${name}&userId=${uid}&email=${mail}`
          ),
        ]);

        if (!cancelled) {
          setAppointment(appointmentData);
          setSession(sessionData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load video session.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.appointmentId]);

  async function joinSession() {
    if (!params.appointmentId) return;

    try {
      const name = encodeURIComponent(authData?.user?.name ?? "Client");
      const uid  = encodeURIComponent(authData?.user?.email ?? "client");
      const mail = encodeURIComponent(authData?.user?.email ?? "");
      const joinedSession = await apiFetch<VideoSessionResponseDTO>(
        `/video-sessions/appointment/${params.appointmentId}/join?moderator=false&displayName=${name}&userId=${uid}&email=${mail}`,
        { method: "POST" }
      );
      setSession(joinedSession);
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join video session.");
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading video session...</div>;
  }

  if (error || !session) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this video session."}
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-blue-100">
          <Video className="size-10 text-blue-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Video Consultation</h1>
          <p className="mt-2 text-sm text-gray-500">
            You&apos;re about to join a secure video session with {appointment?.lawyerName ?? "your lawyer"}. <br />
            Make sure your camera and microphone are enabled.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${
              micOn ? "border-gray-200 bg-white text-gray-700" : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            {micOn ? "Mic on" : "Mic off"}
          </button>
          <button
            onClick={() => setCamOn(!camOn)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${
              camOn ? "border-gray-200 bg-white text-gray-700" : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
            {camOn ? "Camera on" : "Camera off"}
          </button>
        </div>
        <button
          onClick={() => void joinSession()}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Join Session
        </button>
        <Link href="/client/appointments" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-4" /> Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-sm font-medium text-white">Live Session</span>
        </div>
        <span className="text-xs text-gray-400">{appointment?.lawyerName ?? "Lawyer"}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <iframe
          // JaaS JWT goes as a query param so Jitsi authenticates the client.
          // Config overrides go in the URL fragment to skip the pre-join page.
          src={`${session.meetingUrl}${session.jitsiToken ? `?jwt=${session.jitsiToken}` : ""}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full w-full border-none"
          title="Video Session"
        />
      </div>

      <div className="flex items-center justify-center gap-4 bg-gray-900 py-4">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`flex size-12 items-center justify-center rounded-full ${
            micOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>
        <button
          onClick={() => setCamOn(!camOn)}
          className={`flex size-12 items-center justify-center rounded-full ${
            camOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>
        <Link
          href="/client/appointments"
          className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <PhoneOff className="size-5" />
        </Link>
      </div>
    </div>
  );
}
