import { StorageService } from './storageService';

let keyIndex = 0;

export interface SessionEvaluationResult {
  xp: number;
  depthScore: number;      // 1-10
  difficultyScore: number; // 1-10
  feedback: string;
  keyUsed: string;
  modelUsed: string;
  apiError?: string;
  usedFallback: boolean;
}

// Built-in shared OpenRouter Nemotron 3 Ultra 550B configuration (keys dynamically loaded from DB)
export const OPENROUTER_CONFIG = {
  defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  siteUrl: 'https://studyforge.app',
  siteName: 'StudyForge OS',
};

function normalizeGeminiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.startsWith('Ab8') && !trimmed.startsWith('AQ.')) {
    return `AQ.${trimmed}`;
  }
  return trimmed;
}

export const GeminiService = {
  // Retrieves or fetches the shared Free Key from the database
  async getOrFetchFreeKey(): Promise<{ key: string; provider: string; model: string; label?: string } | null> {
    // 1. Check cached free key (valid for 24 hours)
    const cached = StorageService.getFreeKey();
    if (cached && cached.key && Date.now() - cached.fetchedAt < 86400000) {
      return cached;
    }

    // 2. Fetch active free key from backend API connected to DB
    try {
      const endpoints = [
        `https://study-forge-five-pi.vercel.app/api/keys/free?t=${Date.now()}`,
        `/api/keys/free?t=${Date.now()}`
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.key) {
              const freeKeyData = {
                key: data.key,
                provider: data.provider || 'openrouter',
                model: data.model || OPENROUTER_CONFIG.defaultModel,
                label: data.label || 'NVIDIA Nemotron 3 Ultra 550B',
                fetchedAt: Date.now()
              };
              StorageService.saveFreeKey(freeKeyData);
              return freeKeyData;
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Could not fetch free key from backend DB:', e);
    }

    if (cached && cached.key) return cached;
    return null;
  },

  // Returns personal custom keys configured by the user in Settings
  getPersonalKeys(): string[] {
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

  // Backwards compatibility alias
  getKeys(): string[] {
    return this.getPersonalKeys();
  },

  getNextKey(): string {
    const keys = this.getPersonalKeys();
    if (keys.length === 0) return '';
    const key = keys[keyIndex % keys.length];
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
  },

  async testConnection(customKey?: string): Promise<{ success: boolean; message: string; model?: string }> {
    const rawKey = customKey?.trim();

    // Case 1: If user entered a specific key in Settings textarea to test
    if (rawKey) {
      // If it's an OpenRouter key
      if (rawKey.startsWith('sk-or-')) {
        try {
          const res = await fetch(OPENROUTER_CONFIG.endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${rawKey}`,
              'HTTP-Referer': OPENROUTER_CONFIG.siteUrl,
              'X-Title': OPENROUTER_CONFIG.siteName,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: OPENROUTER_CONFIG.defaultModel,
              messages: [{ role: 'user', content: 'Respond with CONNECTED only.' }],
              max_tokens: 10
            })
          });
          if (res.ok) {
            return {
              success: true,
              message: 'Verified! Custom OpenRouter key is active and responding with NVIDIA Nemotron 3 Ultra 550B.',
              model: OPENROUTER_CONFIG.defaultModel
            };
          }
          const err = await res.json().catch(() => ({}));
          return { success: false, message: `OpenRouter Error: ${err?.error?.message || res.statusText}` };
        } catch (e: any) {
          return { success: false, message: e.message || 'Network error testing custom OpenRouter key.' };
        }
      }

      // Otherwise test as Google Gemini key
      const keyToTest = normalizeGeminiKey(rawKey);
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
          message: `Successfully verified (${text})! Gemini 2.5 Flash personal key is active and responding.`,
          model: 'gemini-2.5-flash'
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message || 'Network connection failed. Check your internet connection.'
        };
      }
    }

    // Case 2: No custom key entered — test the built-in primary engine fetched from DB
    try {
      const freeKeyObj = await this.getOrFetchFreeKey();
      if (!freeKeyObj || !freeKeyObj.key) {
        return {
          success: false,
          message: 'Connecting to StudyForge Cloud DB to retrieve free key pool... Please verify network connectivity.'
        };
      }

      const response = await fetch(OPENROUTER_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freeKeyObj.key}`,
          'HTTP-Referer': OPENROUTER_CONFIG.siteUrl,
          'X-Title': OPENROUTER_CONFIG.siteName,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: freeKeyObj.model || OPENROUTER_CONFIG.defaultModel,
          messages: [{ role: 'user', content: 'Respond with CONNECTED only.' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: '✓ Verified! NVIDIA Nemotron 3 Ultra 550B (Loaded from Database) is active and available to all users.',
          model: freeKeyObj.model || OPENROUTER_CONFIG.defaultModel
        };
      }

      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Nemotron Connection Error: ${err?.error?.message || response.statusText}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection failed while reaching OpenRouter.'
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

    let primaryFailureReason = '';

    // TIER 1: First try Built-in OpenRouter with NVIDIA Nemotron 3 Ultra 550B (loaded dynamically from DB)
    const freeKeyObj = await this.getOrFetchFreeKey();
    if (freeKeyObj && freeKeyObj.key) {
      try {
        const orResponse = await fetch(OPENROUTER_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freeKeyObj.key}`,
            'HTTP-Referer': OPENROUTER_CONFIG.siteUrl,
            'X-Title': OPENROUTER_CONFIG.siteName,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: freeKeyObj.model || OPENROUTER_CONFIG.defaultModel,
            messages: [
              {
                role: 'system',
                content: 'You are the StudyForge AI Academic Evaluator. Respond ONLY with valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (orResponse.ok) {
          const orData = await orResponse.json();
          const contentStr = orData?.choices?.[0]?.message?.content;
          if (contentStr) {
            let parsed: any;
            try {
              const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
            } catch {
              parsed = { feedback: contentStr, xp: 60, depthScore: 8, difficultyScore: 7 };
            }
            return {
              xp: Math.max(35, Math.min(100, Number(parsed.xp) || 60)),
              depthScore: Number(parsed.depthScore) || 8,
              difficultyScore: Number(parsed.difficultyScore) || 7,
              feedback: `[⚡ NVIDIA Nemotron 3 Ultra 550B]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
              keyUsed: 'NVIDIA Nemotron-3-Ultra-550B (Database)',
              modelUsed: 'NVIDIA Nemotron 3 Ultra 550B',
              usedFallback: false
            };
          }
        } else {
          const errJson = await orResponse.json().catch(() => ({}));
          primaryFailureReason = `Nemotron HTTP ${orResponse.status}: ${errJson?.error?.message || orResponse.statusText}`;
          console.warn(`[StudyForge AI] Nemotron primary tier failed: ${primaryFailureReason}. Falling back to personal keys...`);
        }
      } catch (err: any) {
        primaryFailureReason = `Nemotron network error (${err?.message || 'Connection failed'})`;
        console.warn(`[StudyForge AI] Nemotron primary tier error: ${primaryFailureReason}. Falling back to personal keys...`);
      }
    } else {
      primaryFailureReason = 'Shared DB free key not currently available';
    }

    // TIER 2: Personal Key Fallback (User-configured Gemini or custom OpenRouter keys in Settings)
    const personalKeys = this.getPersonalKeys();
    let personalFailureReason = '';

    if (personalKeys.length > 0) {
      for (let i = 0; i < personalKeys.length; i++) {
        const key = personalKeys[i];
        try {
          if (key.startsWith('sk-or-')) {
            // Personal OpenRouter key
            const response = await fetch(OPENROUTER_CONFIG.endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'HTTP-Referer': OPENROUTER_CONFIG.siteUrl,
                'X-Title': OPENROUTER_CONFIG.siteName,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: OPENROUTER_CONFIG.defaultModel,
                messages: [
                  {
                    role: 'system',
                    content: 'You are the StudyForge AI Academic Evaluator. Respond ONLY with valid JSON.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2
              })
            });

            if (response.ok) {
              const data = await response.json();
              const contentStr = data?.choices?.[0]?.message?.content;
              if (contentStr) {
                const parsed = JSON.parse(contentStr);
                return {
                  xp: Math.max(35, Math.min(100, Number(parsed.xp) || 60)),
                  depthScore: Number(parsed.depthScore) || 8,
                  difficultyScore: Number(parsed.difficultyScore) || 7,
                  feedback: `[⚡ Custom OpenRouter (Nemotron)]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
                  keyUsed: `Personal OpenRouter (${key.slice(0, 8)}...)`,
                  modelUsed: 'NVIDIA Nemotron 3 Ultra 550B (Custom Key)',
                  usedFallback: false
                };
              }
            } else {
              let errorMsg = '';
              try {
                const errorData = await response.json();
                errorMsg = errorData?.error?.message || '';
              } catch {}
              personalFailureReason = `Personal OpenRouter key failed (HTTP ${response.status}: ${errorMsg || response.statusText})`;
            }
          } else {
            // Personal Google Gemini key
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
                  feedback: `[✨ Google Gemini 2.5 Flash]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
                  keyUsed: `Personal Gemini Key (${key.slice(0, 8)}...)`,
                  modelUsed: 'Google Gemini 2.5 Flash',
                  usedFallback: false
                };
              }
            } else {
              let errorMsg = '';
              try {
                const errorData = await response.json();
                errorMsg = errorData?.error?.message || '';
              } catch {}
              personalFailureReason = `Personal Gemini key failed (HTTP ${response.status}: ${errorMsg || response.statusText})`;
            }
          }
        } catch (err: any) {
          personalFailureReason = `Personal key network error (${err?.message || 'Check connection'})`;
        }
      }
    } else {
      personalFailureReason = 'No personal key configured in Settings.';
    }

    // TIER 3: Offline Academic Heuristic Fallback Engine
    const finalFailureReason = `${primaryFailureReason || 'Primary Nemotron unavailable'}; ${personalFailureReason}`;
    console.warn(`[StudyForge AI] Live AI Keys Failed: "${finalFailureReason}". Switching to Offline Heuristic Logic.`);

    const noteLen = (params.notes || '').trim().length;
    let contentXp = 50;
    if (noteLen > 150) contentXp = 85;
    else if (noteLen > 60) contentXp = 75;
    else if (noteLen > 20) contentXp = 60;

    const feedback = `[⚙️ Offline Academic Engine: ${primaryFailureReason ? 'Live AI rate-limited/offline' : 'Connecting to local engine'}]\n\nSolid focus session on ${params.moduleName}. Consistent effort compounds into mastery!`;

    return {
      xp: contentXp,
      depthScore: noteLen > 30 ? 8 : 7,
      difficultyScore: 7,
      feedback,
      keyUsed: 'Offline Heuristic Engine',
      modelUsed: 'Offline Academic Engine',
      apiError: finalFailureReason,
      usedFallback: true
    };
  }
};
