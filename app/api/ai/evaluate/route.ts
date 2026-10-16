import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exam, moduleName, topicName, notes, durationMinutes } = body;

    if (!notes || notes.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Notes are too short for evaluation'
      }, { status: 400, headers: CORS_HEADERS });
    }

    // 1. Fetch active AI engine key from DB
    const freeKeyRecord = await prisma.freeKey.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (!freeKeyRecord || !freeKeyRecord.key) {
      return NextResponse.json({
        success: false,
        error: 'No active AI engine key configured in database'
      }, { status: 503, headers: CORS_HEADERS });
    }

    const endpoint = freeKeyRecord.endpoint || 'https://api.groq.com/openai/v1/chat/completions';
    const model = freeKeyRecord.model || 'openai/gpt-oss-120b';
    const label = freeKeyRecord.label || '⚡ Groq GPT OSS 120B (Ultra-Fast Free Engine)';

    const prompt = `You are the StudyForge AI Academic Evaluator for competitive exams (${exam || 'UPSC'}).
Evaluate this student study session based strictly on the CONTENT, depth, difficulty, and conceptual coverage described:
- Subject / Module: ${moduleName || 'General Studies'}
- Specific Topic: ${topicName || 'General Practice'}
- Student Notes / What was studied: "${notes.trim()}"

Provide a JSON response with:
{
  "depthScore": (number from 1 to 10 evaluating how deeply concepts were explored),
  "difficultyScore": (number from 1 to 10 evaluating intellectual rigor and topic complexity),
  "feedback": (concise 1-2 sentence high-yield motivational academic feedback acknowledging specific concepts studied),
  "xp": (number from 40 to 100 XP based strictly on content depth and authenticity: basic/short notes = 40-55 XP, solid standard study = 60-75 XP, thorough/rigorous problem-solving or detailed notes = 80-100 XP)
}
Return ONLY valid JSON.`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${freeKeyRecord.key}`,
      'Content-Type': 'application/json'
    };

    if (endpoint.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://studyforge.app';
      headers['X-Title'] = 'StudyForge OS';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are the StudyForge AI Academic Evaluator. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.warn(`[AI Evaluate Route] Provider ${endpoint} HTTP ${aiRes.status}: ${errText}`);
      return NextResponse.json({
        success: false,
        error: `Provider returned HTTP ${aiRes.status}`
      }, { status: 502, headers: CORS_HEADERS });
    }

    const aiData = await aiRes.json();
    const contentStr = aiData?.choices?.[0]?.message?.content;
    if (!contentStr) {
      return NextResponse.json({
        success: false,
        error: 'Empty response from model'
      }, { status: 502, headers: CORS_HEADERS });
    }

    let parsed: any;
    try {
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
    } catch {
      parsed = { feedback: contentStr, xp: 60, depthScore: 8, difficultyScore: 7 };
    }

    // Update lastUsed
    prisma.freeKey.update({
      where: { id: freeKeyRecord.id },
      data: { lastUsed: new Date(), totalCalls: { increment: 1 } }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      evaluation: {
        xp: Math.max(35, Math.min(100, Number(parsed.xp) || 60)),
        depthScore: Number(parsed.depthScore) || 8,
        difficultyScore: Number(parsed.difficultyScore) || 7,
        feedback: `[${label}]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
        keyUsed: `${label} (Server Proxy)`,
        modelUsed: model,
        usedFallback: false
      }
    }, { headers: CORS_HEADERS });

  } catch (err: any) {
    console.error('Server AI evaluation error:', err);
    return NextResponse.json({
      success: false,
      error: err.name === 'AbortError' ? 'AI evaluation timed out' : (err.message || 'Server error')
    }, { status: 500, headers: CORS_HEADERS });
  }
}
