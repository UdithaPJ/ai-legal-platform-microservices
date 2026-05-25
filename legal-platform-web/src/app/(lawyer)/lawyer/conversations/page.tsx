import Link from "next/link";
import { MessageSquare } from "lucide-react";

const conversations = [
  { id: "conv-1", with: "Alex Johnson", matter: "Startup acquisition contract", lastMsg: "Thank you, I'll review the changes you suggested.", time: "1h ago", unread: 1 },
  { id: "conv-2", with: "Maria Garcia", matter: "Employment dispute", lastMsg: "When would you be available for a call?", time: "3h ago", unread: 3 },
  { id: "conv-3", with: "Robert Kim", matter: "IP infringement claim", lastMsg: "I've sent the documents to your email.", time: "Yesterday", unread: 0 },
  { id: "conv-4", with: "Lisa Chen", matter: "Partnership dissolution", lastMsg: "The final settlement has been signed by all parties.", time: "2 days ago", unread: 0 },
];

export default function LawyerConversationsPage() {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="size-12 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/lawyer/conversations/${conv.id}`}
          className="flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
            {conv.with.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{conv.with}</p>
              <span className="text-xs text-gray-400">{conv.time}</span>
            </div>
            <p className="text-xs text-blue-600">{conv.matter}</p>
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
