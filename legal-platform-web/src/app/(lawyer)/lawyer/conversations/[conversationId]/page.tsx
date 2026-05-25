"use client";

import { useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

const initialMessages = [
  { id: "1", sender: "client", name: "Alex Johnson", text: "Hi Sarah, I've just sent over the acquisition documents. Please let me know if you need anything else.", time: "9:15 AM" },
  { id: "2", sender: "me", name: "You", text: "Got them, Alex. I'll start reviewing immediately. Initial read should be done by this afternoon.", time: "9:20 AM" },
  { id: "3", sender: "client", name: "Alex Johnson", text: "Great, thank you. The closing deadline is June 10th so time is tight.", time: "9:22 AM" },
  { id: "4", sender: "me", name: "You", text: "Understood. I'll flag any critical issues as soon as I spot them. We may want to schedule a call tomorrow.", time: "9:25 AM" },
  { id: "5", sender: "client", name: "Alex Johnson", text: "Thank you, I'll review the changes you suggested.", time: "1h ago" },
];

export default function LawyerChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: "me", name: "You", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border bg-white">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/lawyer/conversations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">AJ</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Alex Johnson</p>
          <p className="text-xs text-gray-500">Startup acquisition contract</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%]">
              <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "me" ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm bg-gray-100 text-gray-800"}`}>
                {msg.text}
              </div>
              <p className={`mt-1 text-xs text-gray-400 ${msg.sender === "me" ? "text-right" : ""}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
