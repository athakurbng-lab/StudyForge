"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Successfully registered and logged in
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12121c] border border-white/10 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-syne font-bold text-center mb-8">Join StudyForge</h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Display Name (Optional)</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-xl font-semibold"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Login</Link>
        </p>
      </div>
    </main>
  );
}
