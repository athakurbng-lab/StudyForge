import { StorageService } from './storageService';

let keyIndex = 0;

export interface SessionEvaluationResult {
  xp: number;
  depthScore: number;      // 1-10
  difficultyScore: number; // 1-10
  feedback: string;
  keyUsed: string;
  apiError?: string;
  usedFallback: boolean;
}

function normalizeGeminiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.startsWith('Ab8') && !trimmed.startsWith('AQ.')) {
    return `AQ.${trimmed}`;
  }
  return trimmed;
}

export const GeminiService = {
  getKeys(): string[] {
    const settings = StorageService.getSettings();
    if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
      const customKeys = settings.geminiApiKey
        .split(/[,\n]/)
        .map(k => normalizeGeminiKey(k))
        .filter(k => k.length > 10);
      if (customKeys.length > 0) return customKeys;
    }
    return [];
  },

  getNextKey(): string {
    const keys = this.getKeys();
    if (keys.length === 0) return '';
    const key = keys[keyIndex % keys.length];
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
  },

  async testConnection(customKey?: string): Promise<{ success: boolean; message: string; model?: string }> {
    const rawKey = customKey?.trim() || this.getNextKey();
    const keyToTest = normalizeGeminiKey(rawKey);
    if (!keyToTest) {
      return { success: false, message: 'No API key provided.' };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToTest}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the word "CONNECTED" only.' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return { success: false, message: `API Error: ${errMessage}` };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'CONNECTED';
      return {
        success: true,
        message: `Successfully verified (${text})! Gemini 2.5 Flash is active and responding.`,
        model: 'gemini-2.5-flash'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection failed. Check your internet connection.'
      };
    }
  },

  async evaluateSession(params: {
    exam: string;
    subject: string;
    moduleName: string;
    topicName?: string;
    durationMinutes: number;
    notes: string;
  }): Promise<SessionEvaluationResult> {
    const keys = this.getKeys();
    let failureReason = '';

    const prompt = `You are the StudyForge AI Academic Evaluator for competitive exams (${params.exam}).
Evaluate this student study session based strictly on the CONTENT, depth, difficulty, and conceptual coverage described:
- Subject / Module: ${params.moduleName}
- Specific Topic: ${params.topicName || 'General Practice'}
- Student Notes / What was studied: "${params.notes || 'No detailed notes provided'}"

Provide a JSON response with:
{
  "depthScore": (number from 1 to 10 evaluating how deeply concepts were explored),
  "difficultyScore": (number from 1 to 10 evaluating intellectual rigor and topic complexity),
  "feedback": (concise 1-2 sentence high-yield motivational academic feedback acknowledging specific concepts studied),
  "xp": (number from 40 to 100 XP based strictly on content depth and authenticity: basic/short notes = 40-55 XP, solid standard study = 60-75 XP, thorough/rigorous problem-solving or detailed notes = 80-100 XP)
}
Return ONLY valid JSON.`;

    if (keys.length === 0) {
      failureReason = 'No custom Gemini API key configured in Settings.';
    } else {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json'
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
              const parsed = JSON.parse(jsonText);
              return {
                xp: Math.max(35, Math.min(100, Number(parsed.xp) || 60)),
                depthScore: Number(parsed.depthScore) || 8,
                difficultyScore: Number(parsed.difficultyScore) || 7,
                feedback: parsed.feedback || 'Great session! High retention achieved.',
                keyUsed: `${key.slice(0, 8)}...`,
                usedFallback: false
              };
            }
          } else {
            let errorMsg = '';
            try {
              const errorData = await response.json();
              errorMsg = errorData?.error?.message || '';
            } catch {}

            if (response.status === 400) {
              failureReason = `API key invalid or expired (HTTP 400: ${errorMsg || 'Bad Request'})`;
            } else if (response.status === 403) {
              failureReason = `API key rejected by Google (HTTP 403: ${errorMsg || 'Permission Denied / Key flagged'})`;
            } else if (response.status === 429) {
              failureReason = `API quota or rate limit exceeded (HTTP 429: ${errorMsg || 'Resource Exhausted'})`;
            } else {
              failureReason = `API call failed (HTTP ${response.status}: ${errorMsg || response.statusText})`;
            }
          }
        } catch (err: any) {
          failureReason = `Network error / Offline (${err?.message || 'Check connection'})`;
        }
      }
    }

    // Explicit notification before switching to offline logic
    console.warn(`[StudyForge AI] Live Gemini API Key Failed: "${failureReason}". Switching to Offline Heuristic Logic.`);

    // Content-based heuristic fallback
    const noteLen = (params.notes || '').trim().length;
    let contentXp = 50;
    if (noteLen > 150) contentXp = 85;
    else if (noteLen > 60) contentXp = 75;
    else if (noteLen > 20) contentXp = 60;

    const feedback = `[⚠️ Live AI API Key Failed: ${failureReason} • Switched to Offline Engine]\n\nSolid focus session on ${params.moduleName}. Consistent effort compounds into mastery!`;

    return {
      xp: contentXp,
      depthScore: noteLen > 30 ? 8 : 7,
      difficultyScore: 7,
      feedback,
      keyUsed: 'Offline Heuristic Engine',
      apiError: failureReason,
      usedFallback: true
    };
  }
};
