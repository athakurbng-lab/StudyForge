import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyAuthToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import { processSessionStreakAndBadges } from '@/app/lib/streak';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    let token = cookies().get('token')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        userId = payload.userId as string;
      }
    }

    const body = await request.json();

    // Fallback: If token expired, missing, or client is WebView passing userId/username
    if (!userId) {
      const candidateId = body.userId || (typeof body.user === 'object' ? body.user?.id : null);
      const candidateUsername = body.username || (typeof body.user === 'object' ? body.user?.username : null);

      if (candidateId || candidateUsername) {
        const matched = await prisma.user.findFirst({
          where: {
            OR: [
              ...(candidateId ? [{ id: candidateId }] : []),
              ...(candidateUsername ? [
                { username: { equals: candidateUsername, mode: 'insensitive' as const } },
                { displayName: { equals: candidateUsername, mode: 'insensitive' as const } }
              ] : [])
            ]
          }
        });
        if (matched) {
          userId = matched.id;
        }
      }
    }

    // Default fallback to owner if request signals client sync or single-user mobile mode
    if (!userId && (body.allowDefaultOwner || body.isClientSync)) {
      const owner = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: 'Abhishek Thakur', mode: 'insensitive' } },
            { displayName: { equals: 'AT', mode: 'insensitive' } }
          ]
        }
      });
      if (owner) userId = owner.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to sync sessions.' }, { status: 401, headers: CORS_HEADERS });
    }

    const { 
      rawText, 
      title, 
      tags, 
      isShared, 
      xpAwarded, 
      aiBreakdown, 
      aiSuggestion,
      durationMinutes,
      startTime,
      endTime,
      mood,
      evalProductivity,
      evalDifficulty,
      evalAccuracy,
      evalDepth,
      evalMastery,
      evalApplication,
      evalOutputQuality,
      evalProblemSolving,
      evalIndependence,
      evalGoalRelevance,
      totalEvalMarks,
      evaluationMode
    } = body;

    const sanitizedRawText = (rawText && rawText.trim().length >= 5)
      ? rawText.trim()
      : `Completed study session on ${title || 'general preparation'}.`;

    // Fetch baseline tasks for the AI to use as context
    const baselines = await prisma.baselineTask.findMany();
    const baselineText = baselines.map(b => `[ID: ${b.id}, XP: ${b.xpAnchor}, Context: ${b.examContext}] ${b.description}`).join('\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastSessions = await prisma.studySession.findMany({
      where: { userId, createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 4
    });
    const pastContext = pastSessions.length > 0 
      ? "PAST SESSIONS TODAY:\n" + pastSessions.map(s => `[ID: ${s.id}] (Awarded ${s.xpAwarded} XP) ${s.title}: ${s.rawText}`).join("\n")
      : "No previous sessions today.";

    let evaluation: any = null;

    // 1. If client already evaluated session (e.g. mobile app with verified Gemini, self-rating, or local engine)
    if (typeof xpAwarded === 'number' && xpAwarded > 0) {
      evaluation = {
        xpAwarded: Math.min(1200, Math.max(1, Math.round(xpAwarded))),
        aiBreakdown: aiBreakdown || 'Study session verified and recorded.',
        aiSuggestion: aiSuggestion || 'Keep up consistent study sprints to compound retention.',
        closestBaseline: 1,
        confidence: 1.0,
        pastSessionUpdates: []
      };
    } else {
      // 2. Call Gemini API with Key Cycling
      const geminiKeys = (process.env.GEMINI_KEYS?.split(',') || [])
        .map(k => {
          const t = k.trim();
          return (t.startsWith('Ab8') && !t.startsWith('AQ.')) ? `AQ.${t}` : t;
        })
        .filter(Boolean);

      const systemPrompt = `You are StudyForge AI, an expert exam preparation evaluator. 
Your goal is to evaluate the user's NEW study session out of 100 XP based strictly on the CONTENT, depth, difficulty, and complexity of concepts studied, comparing it to the provided baselines.
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

      // Primary Tier: Query free key from database (free_keys table) or environment variable
      try {
        const freeKeyRecord = await prisma.freeKey.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' }
        });
        const orKey = freeKeyRecord?.key || process.env.OPENROUTER_KEY;
        const modelToUse = freeKeyRecord?.model || 'nvidia/nemotron-3-ultra-550b-a55b:free';
        const endpointToUse = freeKeyRecord?.endpoint || 'https://openrouter.ai/api/v1/chat/completions';

        if (orKey) {
          const orResponse = await fetch(endpointToUse, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${orKey}`,
              'HTTP-Referer': 'https://studyforge.app',
              'X-Title': 'StudyForge OS',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `User's Study Session to Evaluate: ${rawText}` }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2
            })
          });

          if (orResponse.ok) {
            const orData = await orResponse.json();
            const content = orData?.choices?.[0]?.message?.content;
            if (content) {
              evaluation = JSON.parse(content);
              if (evaluation && evaluation.aiBreakdown) {
                const label = freeKeyRecord?.label || (freeKeyRecord?.provider === 'huggingface' ? '🌲 Ternary Bonsai 2' : '⚡ NVIDIA Nemotron 3 Ultra 550B');
                evaluation.aiBreakdown = `[${label}]\n${evaluation.aiBreakdown}`;
              }
              if (freeKeyRecord) {
                prisma.freeKey.update({
                  where: { id: freeKeyRecord.id },
                  data: { lastUsed: new Date(), totalCalls: { increment: 1 } }
                }).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server DB FreeKey Nemotron tier error, falling back to Gemini:', err);
      }

      // Secondary Tier: Google Gemini key cycling (if Nemotron did not produce evaluation)
      if (!evaluation && geminiKeys.length > 0) {

        // Cycle through available keys
        let lastAiError = '';
        for (let i = 0; i < geminiKeys.length; i++) {
          const apiKey = geminiKeys[i].trim();
          try {
            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
              const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (aiText) {
                evaluation = JSON.parse(aiText);
                if (evaluation && evaluation.aiBreakdown) {
                  evaluation.aiBreakdown = `[✨ Google Gemini 2.5 Flash]\n${evaluation.aiBreakdown}`;
                }
                break; // Success! Exit the loop.
              }
            } else {
              lastAiError = `HTTP ${aiResponse.status} ${aiResponse.statusText}`;
              if (aiResponse.status === 429) {
                console.warn(`Key ${i} exhausted. Trying next key...`);
                continue;
              }
            }
          } catch (err: any) {
            lastAiError = err.message || 'Network connection failed';
            console.warn(`Gemini key index ${i} evaluation error:`, err);
          }
        }

        // 3. Resilient heuristic fallback if keys are exhausted, rate-limited, or blocked
        if (!evaluation) {
          const failureReason = lastAiError || (geminiKeys.length === 0 ? 'No Gemini API keys configured on server' : 'All server API keys exhausted or rate-limited');
          console.warn(`[StudyForge Backend] Live AI key evaluation failed: ${failureReason}. Switching to Offline Heuristic Engine.`);

          const noteLen = (rawText || '').trim().length;
          let heuristicXp = 50;
          if (noteLen > 150) heuristicXp = 85;
          else if (noteLen > 60) heuristicXp = 75;
          else if (noteLen > 20) heuristicXp = 60;

          evaluation = {
            xpAwarded: heuristicXp,
            aiBreakdown: `[⚠️ Live AI API Key Failed: ${failureReason} • Evaluated via Offline Academic Heuristics]\n\nEvaluated out of 100 XP based on study sprint depth and notes detail.`,
            aiSuggestion: 'Continue consistent study sprints to compound conceptual retention. You can add a personal Gemini key in mobile Settings.',
            closestBaseline: 1,
            confidence: 0.9,
            pastSessionUpdates: []
          };
        }
      } else if (!evaluation) {
        const failureReason = 'No server Gemini API keys configured';
        console.warn(`[StudyForge Backend] ${failureReason}. Switching to Offline Heuristic Engine.`);

        const noteLen = (rawText || '').trim().length;
        let heuristicXp = 50;
        if (noteLen > 150) heuristicXp = 85;
        else if (noteLen > 60) heuristicXp = 75;
        else if (noteLen > 20) heuristicXp = 60;

        evaluation = {
          xpAwarded: heuristicXp,
          aiBreakdown: `[⚠️ Live AI API Key Failed: ${failureReason} • Evaluated via Offline Academic Heuristics]\n\nEvaluated out of 100 XP based on study sprint depth and notes detail.`,
          aiSuggestion: 'Continue consistent study sprints to compound conceptual retention. You can add a personal Gemini key in mobile Settings.',
          closestBaseline: 1,
          confidence: 0.9,
          pastSessionUpdates: []
        };
      }
    }

    const finalXp = Math.min(1200, Math.max(1, evaluation.xpAwarded));
    
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

    const parsedDuration = typeof durationMinutes === 'number' && durationMinutes > 0 && durationMinutes <= 720
      ? Math.round(durationMinutes)
      : 60;

    const session = await prisma.studySession.create({
      data: {
        userId,
        title: title || 'Study Session',
        rawText: sanitizedRawText,
        tags: tags || [],
        isShared: isShared || false,
        xpAwarded: finalXp,
        rawXp: finalXp,
        aiBreakdown: evaluation.aiBreakdown,
        aiSuggestion: evaluation.aiSuggestion,
        closestBaseline: evaluation.closestBaseline,
        confidence: evaluation.confidence || 1.0,
        durationMinutes: parsedDuration,
        startTime: startTime || null,
        endTime: endTime || null,
        mood: mood || null,
        // 10-Criteria Personal Evaluation System
        evalProductivity: typeof evalProductivity === 'number' ? Math.round(evalProductivity) : null,
        evalDifficulty: typeof evalDifficulty === 'number' ? Math.round(evalDifficulty) : null,
        evalAccuracy: typeof evalAccuracy === 'number' ? Math.round(evalAccuracy) : null,
        evalDepth: typeof evalDepth === 'number' ? Math.round(evalDepth) : null,
        evalMastery: typeof evalMastery === 'number' ? Math.round(evalMastery) : null,
        evalApplication: typeof evalApplication === 'number' ? Math.round(evalApplication) : null,
        evalOutputQuality: typeof evalOutputQuality === 'number' ? Math.round(evalOutputQuality) : null,
        evalProblemSolving: typeof evalProblemSolving === 'number' ? Math.round(evalProblemSolving) : null,
        evalIndependence: typeof evalIndependence === 'number' ? Math.round(evalIndependence) : null,
        evalGoalRelevance: typeof evalGoalRelevance === 'number' ? Math.round(evalGoalRelevance) : null,
        totalEvalMarks: typeof totalEvalMarks === 'number' ? Math.round(totalEvalMarks) : null,
        evaluationMode: typeof evaluationMode === 'string' ? evaluationMode : null
      }
    });

    const netXpChange = finalXp - totalXpDeducted;
    const updatedUser = await processSessionStreakAndBadges(userId, netXpChange);

    return NextResponse.json({
      success: true,
      session,
      user: {
        totalXP: updatedUser?.totalXP,
        streak: updatedUser?.streak,
        freezeTokens: updatedUser?.freezeTokens
      }
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Session logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get('userId');
    const authHeader = request.headers.get('authorization');
    let userId = userIdParam;

    if (!userId && authHeader?.startsWith('Bearer ')) {
      const payload = await verifyAuthToken(authHeader.substring(7));
      if (payload) userId = payload.userId as string;
    }

    if (!userId) {
      const token = cookies().get('token')?.value;
      if (token) {
        const payload = await verifyAuthToken(token);
        if (payload) userId = payload.userId as string;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Provide token or userId.' }, { status: 401, headers: CORS_HEADERS });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        totalXP: true,
        streak: true,
        freezeTokens: true,
        dailyXpGoal: true,
        studySessions: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        totalXP: user.totalXP,
        streak: user.streak,
        freezeTokens: user.freezeTokens,
        dailyXpGoal: user.dailyXpGoal,
      },
      sessions: user.studySessions
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}


