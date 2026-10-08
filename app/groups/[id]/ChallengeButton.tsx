"use client";

import { useState } from "react";

export function ChallengeButton({ 
  targetUserId, 
  groupId, 
  alreadyChallenged
}: { 
  targetUserId: string, 
  groupId: string, 
  alreadyChallenged: boolean
}) {
  const [status, setStatus] = useState<string | null>(alreadyChallenged ? "Challenged ⚔️" : null);

  const handleChallenge = async () => {
    setStatus("Analyzing learning curve... 🤖");
    
    try {
      const res = await fetch('/api/challenges/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, groupId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setStatus("Error: " + (data.error || "Failed to challenge"));
        return;
      }

      setStatus(data.message);
    } catch (err) {
      setStatus("Error validating score");
    }
  };

  if (status) {
    return (
      <div className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-white/10 px-3 py-1 rounded-full text-center max-w-[250px]">
        {status}
      </div>
    );
  }

  return (
    <button 
      onClick={handleChallenge}
      className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
      title="Costs 1 Challenge Token"
    >
      Challenge
    </button>
  );
}
