import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import { processSessionStreakAndBadges } from '@/app/lib/streak';

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rawText, title, tags, isShared } = await request.json();

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json({ error: 'Session description is too short.' }, { status: 400 });
    }

    // Fetch baseline tasks for the AI to use as context
    const baselines = await prisma.baselineTask.findMany();
    const baselineText = baselines.map(b => `[ID: ${b.id}, XP: ${b.xpAnchor}, Context: ${b.examContext}] ${b.description}`).join('\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastSessions = await prisma.studySession.findMany({
      where: { userId: payload.userId as string, createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 4
    });
    const pastContext = pastSessions.length > 0 
      ? "PAST SESSIONS TODAY:\n" + pastSessions.map(s => `[ID: ${s.id}] (Awarded ${s.xpAwarded} XP) ${s.title}: ${s.rawText}`).join("\n")
      : "No previous sessions today.";

    // Call Gemini API with Key Cycling
    const geminiKeys = process.env.GEMINI_KEYS?.split(',').map(k => k.trim()).filter(Boolean) || [];
    if (geminiKeys.length === 0) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are StudyForge AI, an expert exam preparation evaluator. 
Your goal is to evaluate the user's NEW study session out of 100 XP based on its difficulty, intensity, and duration, comparing it to the provided baselines.
CRITICAL LEARNING CURVE: You are also provided with the user's up to 4 previous sessions from today. It is completely normal for a user to study the same topic across multiple sessions (e.g. reading consecutive chapters). Do NOT penalize them just for staying on one subject. You should ONLY retroactively adjust or penalize XP if you detect obvious cheating, identical copy-pasted duplicates, or zero-effort spam. If the new session reveals they were actually working on a massive, highly difficult project, you can INCREASE their past XP.

Return a raw JSON object (without markdown blocks) with the following structure:
{
  "xpAwarded": number (0-100, the XP for the NEW session),
  "aiBreakdown": "Brief 1-2 sentence explanation of why they got this score",
  "aiSuggestion": "One highly actionable piece of advice to improve their study habits",
  "closestBaseline": number (the ID of the baseline task most similar in effort),
  "confidence": number (0.0 to 1.0),
  "pastSessionUpdates": [
     { "id": "uuid of past session", "newXp": number (can be higher or lower than original XP) }
  ]
}

BASELINES FOR COMPARISON:
${baselineText}

${pastContext}`;

    let aiResponse;
    let aiText = "";
    
    // Cycle through available keys
    for (let i = 0; i < geminiKeys.length; i++) {
      const apiKey = geminiKeys[i].trim();
      
      aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `User's Study Session to Evaluate: ${rawText}` }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2
          }
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiText = aiData.candidates[0].content.parts[0].text;
        break; // Success! Exit the loop.
      } else if (aiResponse.status === 429) {
        console.warn(`Key ${i} exhausted. Trying next key...`);
        continue; // Try the next key in the cycle
      } else {
        console.error('Gemini API Error:', await aiResponse.text());
        return NextResponse.json({ error: 'Failed to evaluate session with AI.' }, { status: 500 });
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      return NextResponse.json({ error: 'All AI API keys exhausted or failed.' }, { status: 500 });
    }
    
    let evaluation;
    try {
      evaluation = JSON.parse(aiText);
    } catch (e) {
      console.error('Failed to parse AI JSON:', aiText);
      return NextResponse.json({ error: 'AI returned invalid format.' }, { status: 500 });
    }

    const finalXp = Math.min(100, Math.max(1, evaluation.xpAwarded));
    
    // Process retro-active XP updates for learning curve
    let totalXpDeducted = 0;
    if (evaluation.pastSessionUpdates && Array.isArray(evaluation.pastSessionUpdates)) {
      for (const update of evaluation.pastSessionUpdates) {
        const pastSession = pastSessions.find((s: any) => s.id === update.id);
        if (pastSession && update.newXp !== pastSession.xpAwarded && update.newXp >= 0) {
          const deduction = pastSession.xpAwarded - update.newXp; // negative if buffed
          totalXpDeducted += deduction;
          
          const changeText = deduction > 0 
            ? `Reduced by ${deduction} XP due to repetitive learning curve` 
            : `Increased by ${-deduction} XP due to newly discovered complexity`;

          await prisma.studySession.update({
            where: { id: pastSession.id },
            data: { 
              xpAwarded: update.newXp, 
              aiBreakdown: pastSession.aiBreakdown + `\n\n[AI UPDATE: ${changeText}]` 
            }
          });
        }
      }
    }

    const session = await prisma.studySession.create({
      data: {
        userId: payload.userId as string,
        title: title || 'Study Session',
        rawText,
        tags: tags || [],
        isShared: isShared || false,
        xpAwarded: finalXp,
        rawXp: finalXp,
        aiBreakdown: evaluation.aiBreakdown,
        aiSuggestion: evaluation.aiSuggestion,
        closestBaseline: evaluation.closestBaseline,
        confidence: evaluation.confidence || 1.0
      }
    });

    const netXpChange = finalXp - totalXpDeducted;
    await processSessionStreakAndBadges(payload.userId as string, netXpChange);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Session logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
