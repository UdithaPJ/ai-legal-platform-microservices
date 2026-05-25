import Link from "next/link";
import { MessageSquare } from "lucide-react";

const conversations = [
  { id: "conv-1", with: "Sarah Mitchell", role: "Corporate Lawyer", lastMsg: "I'll review the contract and get back to you by Friday.", time: "2h ago", unread: 2 },
  { id: "conv-2", with: "James Okafor", role: "Criminal Defence", lastMsg: "Please send me all the documents related to the incident.", time: "Yesterday", unread: 0 },
  { id: "conv-3", with: "Priya Sharma", role: "Family Law", lastMsg: "The hearing has been scheduled for June 15th.", time: "2 days ago", unread: 0 },
];

export default function ClientConversationsPage() {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="size-12 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">No conversations yet. Book an appointment to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/client/conversations/${conv.id}`}
          className="flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {conv.with.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{conv.with}</p>
              <span className="text-xs text-gray-400">{conv.time}</span>
            </div>
            <p className="text-xs text-gray-500">{conv.role}</p>
            <p className="mt-1 truncate text-sm text-gray-600">{conv.lastMsg}</p>
          </div>
          {conv.unread > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              {conv.unread}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
