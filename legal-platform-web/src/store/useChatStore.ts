"use client";

import { create } from "zustand";
import type { Conversation, Message } from "@/types/message";

interface ChatState {
  activeConversationId: string | null;
  conversations: Conversation[];
  unreadCounts: Record<string, number>;
  pendingMessages: Message[];
  setActiveConversation: (id: string | null) => void;
  setConversations: (convs: Conversation[]) => void;
  addMessage: (msg: Message) => void;
  clearPending: () => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  conversations: [],
  unreadCounts: {},
  pendingMessages: [],
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setConversations: (conversations) => set({ conversations }),
  addMessage: (msg) =>
    set((s) => ({ pendingMessages: [...s.pendingMessages, msg] })),
  clearPending: () => set({ pendingMessages: [] }),
  incrementUnread: (id) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [id]: (s.unreadCounts[id] ?? 0) + 1 },
    })),
  clearUnread: (id) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [id]: 0 } })),
}));
