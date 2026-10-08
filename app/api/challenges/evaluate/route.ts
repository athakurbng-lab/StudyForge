import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

const geminiKeys = process.env.GEMINI_KEYS?.split(',') || [];

let currentKeyIndex = 0;

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { targetUserId, groupId } = body;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if challenge already exists
    const existing = await prisma.scoreChallenge.findFirst({
      where: { targetUserId, challengeDate: todayStr, challengerId: payload.userId as string }
    });
    if (existing) return NextResponse.json({ error: 'Already challenged today' }, { status: 400 });

    // Fetch target user's sessions for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.studySession.findMany({
      where: {
        userId: targetUserId,
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (todaySessions.length === 0) {
      return NextResponse.json({ message: "Challenge Void 🛡️ (No sessions today)", deducted: 0 });
    }

    const originalXp = todaySessions.reduce((sum, s) => sum + s.xpAwarded, 0);
    const todayText = todaySessions.map(s => `[${s.title}] (Originally awarded ${s.xpAwarded} XP):\n${s.rawText}`).join("\n\n---\n\n");

    const prompt = `You are an extremely strict AI adjudicator for a study tracker app. 
A user has been challenged by their peers. You must read their logged study sessions for TODAY and determine if they are artificially inflating their XP. 

CRITICAL RULE (The Learning Curve): 
It is completely normal for a user to log multiple sessions today covering the same subject (e.g., studying calculus all day). Do NOT penalize them just for staying on one topic. You must ONLY reduce their XP if you detect they are logging identical copy-pasted duplicates, zero-effort spam, or clearly trying to cheat the system.

=== TODAY'S SESSIONS TO EVALUATE ===
Total Original XP Awarded Today: ${originalXp}

${todayText}
=====================================

Respond ONLY with a JSON object:
{
  "newXp": <number, the strictly recalculated total XP for TODAY'S sessions combined. If they undervalued their work, you CAN increase this above the original XP>,
  "reason": "<string, short brutal explanation of why you adjusted XP, focusing on the learning curve if they repeated topics>"
}`;

    let data;
    let attempts = 0;
    while (attempts < geminiKeys.length) {
      const apiKey = geminiKeys[currentKeyIndex];
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.status === 429) {
        currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;
        attempts++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const rawRes = result.candidates[0].content.parts[0].text;
      data = JSON.parse(rawRes);
      break;
    }

    if (!data) throw new Error("All API keys failed or rate limited");

    const finalDeducted = originalXp - data.newXp; // can be negative if AI buffs score

    await prisma.scoreChallenge.create({
      data: {
        challengerId: payload.userId as string,
        targetUserId,
        groupId,
        challengeDate: todayStr,
        originalDayXp: originalXp,
        newDayXp: data.newXp,
        sessionsCount: todaySessions.length,
        result: finalDeducted !== 0 ? 'SCORE_CHANGED' : 'SCORE_CONFIRMED'
      }
    });

    if (finalDeducted !== 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { totalXP: { decrement: finalDeducted } } // decrementing a negative adds XP
      });
      if (finalDeducted > 0) {
        return NextResponse.json({ message: `Challenge Won! ⚔️ (AI Deducted ${finalDeducted} XP)`, deducted: finalDeducted });
      } else {
        return NextResponse.json({ message: `Challenge Backfired! 🛡️ (AI INCREASED their score by ${-finalDeducted} XP!)`, deducted: finalDeducted });
      }
    } else {
      return NextResponse.json({ message: "Challenge Lost 🛡️ (AI Verified Exact Score)", deducted: 0 });
    }

  } catch (error) {
    console.error('Challenge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
