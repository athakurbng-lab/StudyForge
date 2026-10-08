"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMemo } from "react";

export function DashboardChart({ sessions }: { sessions: { createdAt: Date, xpAwarded: number }[] }) {
  const data = useMemo(() => {
    const days: Record<string, number> = {};
    
    // Initialize last 30 days with 0 XP
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })] = 0;
    }

    // Populate actual XP
    sessions.forEach(s => {
      const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (days[dateStr] !== undefined) {
        days[dateStr] += s.xpAwarded;
      }
    });

    return Object.entries(days).map(([date, xp]) => ({ date, xp }));
  }, [sessions]);

  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            minTickGap={30}
            tick={{ dy: 10 }}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value} XP`}
          />
          <Tooltip 
            cursor={{ fill: '#ffffff0a' }}
            contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #ffffff1a', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="xp" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
