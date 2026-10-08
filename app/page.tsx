import Link from 'next/link';
import { Anvil } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#0a0a0f] relative overflow-hidden">
      {/* Particle field placeholder */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#12121a] via-[#0a0a0f] to-[#0a0a0f]" />
      
      <div className="z-10 text-center mb-12">
        <h1 className="flex items-center justify-center gap-4 text-6xl font-bold font-syne mb-4 text-transparent bg-clip-text bg-gradient-to-br from-[#6366f1] to-[#22d3ee]">
          <Anvil className="w-16 h-16 text-indigo-500" />
          StudyForge
        </h1>
        <p className="text-xl text-[#94a3b8]">
          Don't count the hours. Make them count.
        </p>
      </div>

      <div className="z-10 w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 text-center shadow-2xl">
        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#f59e0b] mb-4">
          🔥 Motivation
        </div>
        <h2 className="text-3xl font-semibold mb-6">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
        </h2>
        <p className="text-[#94a3b8] mb-2">— Aristotle</p>
        <p className="text-sm italic text-[#475569]">
          Your exam result is the sum of your daily study habits.
        </p>
      </div>

      <div className="z-10 flex gap-4">
        <Link href="/register" className="px-8 py-3 bg-[#6366f1] hover:bg-[#4f46e5] transition-colors rounded-xl font-semibold text-white">
          Get Started
        </Link>
        <Link href="/login" className="px-8 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-semibold text-white border border-white/10">
          Login
        </Link>
      </div>
    </main>
  );
}
