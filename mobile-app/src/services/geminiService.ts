import { StorageService } from './storageService';

let keyIndex = 0;

export interface SessionEvaluationResult {
  xp: number;
  depthScore: number;      // 1-10
  difficultyScore: number; // 1-10
  feedback: string;
  keyUsed: string;
}

export const GeminiService = {
  getKeys(): string[] {
    const settings = StorageService.getSettings();
    if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
      const customKeys = settings.geminiApiKey
        .split(/[,\n]/)
        .map(k => k.trim())
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
    const keyToTest = customKey?.trim() || this.getNextKey();
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
    const key = this.getNextKey();
    const prompt = `You are the StudyForge AI Academic Evaluator for competitive exams (${params.exam}).
Evaluate this student study session:
- Subject / Module: ${params.moduleName}
- Specific Topic: ${params.topicName || 'General Practice'}
- Duration: ${params.durationMinutes} minutes
- Student Notes / Summary: "${params.notes || 'No detailed notes provided'}"

Provide a JSON response with:
{
  "depthScore": (number from 1 to 10),
  "difficultyScore": (number from 1 to 10),
  "feedback": (concise 1-2 sentence high-yield motivational academic feedback acknowledging specific concepts studied),
  "xp": (number calculated based on duration: roughly durationMinutes * 1.5 to 2.2 with bonuses for depth and authentic notes, typically between 60 and 300 XP)
}
Return ONLY valid JSON.`;

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
            xp: Math.max(30, Math.min(400, Number(parsed.xp) || Math.round(params.durationMinutes * 1.8))),
            depthScore: Number(parsed.depthScore) || 8,
            difficultyScore: Number(parsed.difficultyScore) || 7,
            feedback: parsed.feedback || 'Great session! High retention achieved.',
            keyUsed: `${key.slice(0, 8)}...`
          };
        }
      }
    } catch (err) {
      console.warn('Gemini live evaluation failed, falling back to local heuristic formula:', err);
    }

    // High quality heuristic fallback if offline or rate limited
    const baseRate = 1.8;
    const noteBonus = params.notes && params.notes.length > 20 ? 30 : 10;
    const calculatedXp = Math.round(params.durationMinutes * baseRate) + noteBonus;

    return {
      xp: Math.max(40, calculatedXp),
      depthScore: params.notes && params.notes.length > 30 ? 8 : 7,
      difficultyScore: 7,
      feedback: `Strong focus session on ${params.moduleName}. Consistent effort compounds into mastery!`,
      keyUsed: 'StudyForge Heuristic Engine'
    };
  }
};
