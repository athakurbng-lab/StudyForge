"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LogSessionPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState("General");
  const [isShared, setIsShared] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: input, 1: loading animation, 2: result
  const [result, setResult] = useState<any>(null);

  const tags = ["General", "Physics", "Math", "Chemistry", "Biology", "CS / Coding", "Literature"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (text.length < 10) return;
    
    setLoading(true);
    setStep(1);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: text,
          title: title.trim() || undefined,
          tags: [selectedTag],
          isShared
        }),
      });
      
      const data = await res.json();
      
      // Simulate AI loading steps visually
      setTimeout(() => {
        setStep(2);
        router.refresh(); // Force server components to refetch (updates the layout XP)
      }, 2400); 
      setResult(data.session);

    } catch (err) {
      console.error(err);
      setStep(0);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
      <Link href="/dashboard" className="text-slate-400 hover:text-white mb-8 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto mt-8">
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl">
            <h1 className="text-2xl font-syne font-bold mb-2">Log Study Session</h1>
            <p className="text-slate-400 mb-6 text-sm">Write down what you did. Don't worry about format, the AI will figure it out.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Session Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Thermo Lecture + 15 Practice Problems"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedTag === tag 
                          ? "bg-indigo-600 text-white" 
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">What did you study?</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="E.g., Solved 15 JEE integration problems, watched 45 min thermo lecture..."
                  className="w-full h-36 bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  required
                  minLength={10}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-600 focus:ring-0"
                  />
                  <span>Share session publicly with peers</span>
                </label>

                <button 
                  type="submit" 
                  disabled={text.length < 10 || loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-xl font-semibold flex items-center gap-2 text-sm"
                >
                  ✨ Evaluate Session
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-syne font-bold mb-2 animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Analysing Session...
            </h2>
            <p className="text-slate-400">Comparing against 15 baselines...</p>
          </motion.div>
        )}

        {step === 2 && result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-syne font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              +{result.xpAwarded} XP
            </h2>
            <p className="text-lg mb-8">{result.title}</p>
            
            <div className="bg-black/20 rounded-xl p-6 text-left mb-8 border border-white/5">
              <h3 className="font-semibold text-indigo-300 mb-2">AI Breakdown</h3>
              <p className="text-slate-300 mb-4 text-sm leading-relaxed">{result.aiBreakdown}</p>
              
              <h3 className="font-semibold text-cyan-300 mb-2">Suggestion</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{result.aiSuggestion}</p>
            </div>

            <button 
              onClick={() => { setStep(0); setText(""); }}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-semibold border border-white/10"
            >
              Log Another Session
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
