"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState(50);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyXpGoal: goal }),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#0a0a0f]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl text-center"
      >
        <div className="text-6xl mb-6">🎯</div>
        <h2 className="text-3xl font-syne font-bold mb-4">Set Your Goal</h2>
        <p className="text-slate-400 mb-8 text-sm">
          How much XP do you want to aim for every day? (You can change this later).
          A typical study session is worth around 15-30 XP.
        </p>

        <div className="flex items-center justify-center gap-6 mb-10">
          <button 
            onClick={() => setGoal(Math.max(20, goal - 10))}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl"
          >
            -
          </button>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 w-32">
            {goal} <span className="text-lg text-slate-500">XP</span>
          </div>
          <button 
            onClick={() => setGoal(goal + 10)}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>

        <button 
          onClick={handleFinish}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-colors"
        >
          {loading ? "Saving..." : "Start Studying"}
        </button>
      </motion.div>
    </main>
  );
}
