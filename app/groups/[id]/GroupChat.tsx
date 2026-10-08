"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  user: { username: string; displayName: string | null };
};

export function GroupChat({ groupId, initialMessages, currentUserId, currentUserRole }: { groupId: string, initialMessages: Message[], currentUserId: string, currentUserRole?: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages([data.message, ...messages]);
        setContent("");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/chat?messageId=${messageId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== messageId));
      }
    } catch (err) {}
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col h-[500px]">
      <h3 className="text-lg font-syne font-bold mb-4">Live Chat (24h)</h3>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 flex flex-col-reverse pr-2">
        {messages.map(msg => {
          const isMe = msg.user.username === currentUserId || msg.user.displayName === currentUserId; // simplified check
          const canDelete = isMe || currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <span className="text-xs text-slate-500 mb-1">{msg.user.displayName || msg.user.username}</span>
              <div className="flex items-center gap-2">
                {isMe && canDelete && <button onClick={() => handleDelete(msg.id)} className="text-[10px] uppercase font-bold text-red-500/50 hover:text-red-400 px-2 transition-colors">Delete</button>}
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'}`}>
                  {msg.content}
                </div>
                {!isMe && canDelete && <button onClick={() => handleDelete(msg.id)} className="text-[10px] uppercase font-bold text-red-500/50 hover:text-red-400 px-2 transition-colors">Delete</button>}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-slate-500 my-auto pb-8">
            No messages yet. Say hello!
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button 
          type="submit" 
          disabled={loading || !content.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
