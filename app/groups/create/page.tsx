"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create group");

      router.push("/groups");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Link href="/groups" className="text-slate-400 hover:text-white mb-8 inline-block">
        ← Back to Groups
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-syne font-bold mb-6">Create a Study Group</h1>
        
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white transition-colors"
              required
              placeholder="E.g., UPSC 2027 Aspirants"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 h-24 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white transition-colors resize-none"
              placeholder="What is this group about?"
            />
          </div>

          <div className="flex items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/10">
            <input 
              type="checkbox" 
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-600 bg-black/20"
            />
            <label htmlFor="isPublic" className="text-sm font-medium text-slate-300">
              Make Group Public (Anyone can ask to join)
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-xl font-bold text-lg"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
