"use client";

import { useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

const initialMessages = [
  { id: "1", sender: "lawyer", name: "Sarah Mitchell", text: "Hello! I've reviewed the documents you sent over. I have a few questions before we proceed.", time: "10:02 AM" },
  { id: "2", sender: "me", name: "You", text: "Of course, please go ahead.", time: "10:05 AM" },
  { id: "3", sender: "lawyer", name: "Sarah Mitchell", text: "In clause 7.3 of the contract, there's a non-compete that seems overly broad. It covers a 3-year period across all of North America. Have you already discussed narrowing the scope with the other party?", time: "10:07 AM" },
  { id: "4", sender: "me", name: "You", text: "Not yet — I was hoping you could advise on what's standard and what we should push back on.", time: "10:10 AM" },
  { id: "5", sender: "lawyer", name: "Sarah Mitchell", text: "Absolutely. Industry standard is typically 1–2 years and limited to specific regions. I'll draft a counter-proposal and send it to you by end of day.", time: "10:12 AM" },
];

export default function ClientChatPage() {
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
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/client/conversations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">SM</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Sarah Mitchell</p>
          <p className="text-xs text-gray-500">Corporate Law · Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] ${msg.sender === "me" ? "order-2" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === "me"
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
              <p className={`mt-1 text-xs text-gray-400 ${msg.sender === "me" ? "text-right" : ""}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
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
