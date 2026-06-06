"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTimestamp, getInitials } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { Conversation, Message } from "@/types/message";
import type { UserResponse } from "@/types/user";

type ConversationListItem = {
  conversation: Conversation;
  otherPartyName: string;
  roleLabel: string;
  lastMessage: string;
  time: string;
};

export default function ClientConversationsPage() {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const conversations = await apiFetch<Conversation[]>("/messages/conversations/me");
        const hydrated = await Promise.all(
          conversations.map(async (conversation) => {
            const [otherParty, appointment, messages] = await Promise.all([
              apiFetch<UserResponse>(`/users/${conversation.lawyerId}`).catch(() => null),
              apiFetch<AppointmentResponseDTO>(`/appointments/${conversation.appointmentId}`).catch(() => null),
              apiFetch<Message[]>(`/messages/${conversation.id}`).catch(() => []),
            ]);

            const lastMessage = [...messages].sort(
              (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
            )[0];

            return {
              conversation,
              otherPartyName: otherParty?.fullName ?? "Lawyer",
              roleLabel: appointment?.lawyerName ?? "Lawyer",
              lastMessage: lastMessage?.content ?? "No messages yet.",
              time: formatRelativeTimestamp(lastMessage?.createdAt ?? conversation.createdAt),
            };
          })
        );

        if (!cancelled) {
          setItems(
            hydrated.sort(
              (left, right) =>
                new Date(right.conversation.createdAt).getTime() -
                new Date(left.conversation.createdAt).getTime()
            )
          );
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load conversations.");
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
  }, []);

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading conversations...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="size-12 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">No conversations yet. Book an appointment to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {items.map((item) => (
        <Link
          key={item.conversation.id}
          href={`/client/conversations/${item.conversation.id}`}
          className="flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {getInitials(item.otherPartyName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{item.otherPartyName}</p>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
            <p className="text-xs text-gray-500">{item.roleLabel}</p>
            <p className="mt-1 truncate text-sm text-gray-600">{item.lastMessage}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
