"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useStompChat } from "@/hooks/useStompChat";
import { getInitials } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { Conversation, Message, SendMessageRequest } from "@/types/message";
import type { UserResponse } from "@/types/user";

export default function ClientChatPage() {
  const params  = useParams<{ conversationId: string }>();
  const { data: session } = useSession();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [lawyer,       setLawyer]       = useState<UserResponse | null>(null);
  const [appointment,  setAppointment]  = useState<AppointmentResponseDTO | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Auto-scroll anchor
  const bottomRef    = useRef<HTMLDivElement>(null);
  const initialLoad  = useRef(true);

  // ── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!params.conversationId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const [conversations, messageData] = await Promise.all([
          apiFetch<Conversation[]>("/messages/conversations/me"),
          apiFetch<Message[]>(`/messages/${params.conversationId}`),
        ]);

        const current = conversations.find((c) => c.id === params.conversationId) ?? null;
        if (!current) throw new Error("Conversation not found.");

        const [lawyerData, appointmentData] = await Promise.all([
          apiFetch<UserResponse>(`/users/${current.lawyerId}`).catch(() => null),
          apiFetch<AppointmentResponseDTO>(`/appointments/${current.appointmentId}`).catch(() => null),
        ]);

        if (!cancelled) {
          setConversation(current);
          setMessages([...messageData].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ));
          setLawyer(lawyerData);
          setAppointment(appointmentData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load conversation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [params.conversationId]);

  // ── Real-time STOMP subscription ────────────────────────────────────────────
  const { connected } = useStompChat({
    conversationId: conversation?.id,
    accessToken:    session?.accessToken,
    onMessage: (msg) => {
      setMessages((prev) => {
        // Deduplicate: the sender already added it optimistically via REST
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });

  // ── Scroll to bottom on new messages ────────────────────────────────────────
  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({
      behavior: initialLoad.current ? "instant" : "smooth",
    });
    initialLoad.current = false;
  }, [messages]);

  // ── Send via REST (backend also broadcasts to WebSocket) ─────────────────────
  async function sendMessage() {
    if (!conversation || !input.trim()) return;
    setSending(true);
    try {
      const payload: SendMessageRequest = {
        clientId:      conversation.clientId,
        lawyerId:      conversation.lawyerId,
        appointmentId: conversation.appointmentId,
        content:       input.trim(),
      };
      const created = await apiFetch<Message>("/messages", {
        method: "POST",
        body:   JSON.stringify(payload),
      });
      // The STOMP broadcast from the backend may have already delivered this
      // message via WebSocket before the HTTP response returned.
      // Deduplicate by id so the message never appears twice regardless of
      // which path (REST response or STOMP frame) arrives first.
      setMessages((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [...prev, created]
      );
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading conversation…</div>;
  }
  if (error || !conversation) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this conversation."}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/client/conversations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {getInitials(lawyer?.fullName ?? "Lawyer")}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{lawyer?.fullName ?? "Lawyer"}</p>
          <p className="text-xs text-gray-500">{appointment?.lawyerName ?? "Consultation"}</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`size-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`} />
          {connected ? "Live" : "Connecting…"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const mine = msg.senderId === session?.user.sub;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-gray-800"
                }`}>
                  {msg.content}
                </div>
                <p className={`mt-1 text-xs text-gray-400 ${mine ? "text-right" : ""}`}>
                  {new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(new Date(msg.createdAt))}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 border-t px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void sendMessage()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={!input.trim() || sending}
          className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
