"use client";

import { useState } from "react";
import { ArrowLeft, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import Link from "next/link";

const MOCK_MEETING_URL = "https://meet.jit.si/LegalPlatformDemo-appt-1";

export default function ClientVideoPage(props: { params: Promise<{ appointmentId: string }> }) {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  if (!joined) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-blue-100">
          <Video className="size-10 text-blue-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Video Consultation</h1>
          <p className="mt-2 text-sm text-gray-500">
            You're about to join a secure video session with your lawyer. <br />
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
          onClick={() => setJoined(true)}
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-white">Live Session</span>
        </div>
        <span className="text-xs text-gray-400">Sarah Mitchell · Corporate Law</span>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${MOCK_MEETING_URL}#userInfo.displayName="Client"`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-full w-full border-none"
          title="Video Session"
        />
      </div>

      {/* Controls overlay */}
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
