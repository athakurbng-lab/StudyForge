import { StorageService } from './storageService';

let keyIndex = 0;

export interface EvaluationCriterionScores {
  evalProductivity: number;
  evalDifficulty: number;
  evalAccuracy: number;
  evalDepth: number;
  evalMastery: number;
  evalApplication: number;
  evalOutputQuality: number;
  evalProblemSolving: number;
  evalIndependence: number;
  evalGoalRelevance: number;
}

export interface SessionEvaluationResult {
  xp: number;
  totalEvalMarks: number;
  evalScores: EvaluationCriterionScores;
  depthScore: number;      // 1-10 (kept for backwards compatibility)
  difficultyScore: number; // 1-10 (kept for backwards compatibility)
  feedback: string;
  keyUsed: string;
  modelUsed: string;
  apiError?: string;
  usedFallback: boolean;
  evaluationMode?: 'manual' | 'ai';
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
  async getOrFetchFreeKey(): Promise<{ key: string; provider: string; model: string; endpoint?: string; label?: string } | null> {
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
                endpoint: data.endpoint || OPENROUTER_CONFIG.endpoint,
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

      const targetEndpoint = freeKeyObj.endpoint || OPENROUTER_CONFIG.endpoint;
      const targetModel = freeKeyObj.model || OPENROUTER_CONFIG.defaultModel;
      const targetLabel = freeKeyObj.label || (freeKeyObj.provider === 'huggingface' ? 'Ternary Bonsai 2' : 'NVIDIA Nemotron 3 Ultra 550B');

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freeKeyObj.key}`,
          'HTTP-Referer': OPENROUTER_CONFIG.siteUrl,
          'X-Title': OPENROUTER_CONFIG.siteName,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Respond with CONNECTED only.' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `✓ Verified! ${targetLabel} (Loaded from Database) is active and available to all users.`,
          model: targetModel
        };
      }

      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `${targetLabel} Connection Error: ${err?.error?.message || response.statusText}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection failed while reaching AI endpoint.'
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
    const hardTimeoutPromise = new Promise<SessionEvaluationResult>((resolve) => {
      setTimeout(() => {
        const noteLen = (params.notes || '').trim().length;
        const defaultScore = noteLen > 100 ? 8 : (noteLen > 30 ? 6 : 5);
        const fallbackScores: EvaluationCriterionScores = {
          evalProductivity: defaultScore,
          evalDifficulty: 7,
          evalAccuracy: defaultScore,
          evalDepth: noteLen > 30 ? 7 : 5,
          evalMastery: defaultScore,
          evalApplication: 6,
          evalOutputQuality: noteLen > 50 ? 7 : 5,
          evalProblemSolving: 6,
          evalIndependence: 7,
          evalGoalRelevance: 8
        };
        const totalMarks = Object.values(fallbackScores).reduce((sum, v) => sum + v, 0);
        const focusedHours = Math.max(0.01, (params.durationMinutes || 60) / 60);
        const contentXp = Math.max(1, Math.round(focusedHours * totalMarks));

        resolve({
          xp: contentXp,
          totalEvalMarks: totalMarks,
          evalScores: fallbackScores,
          depthScore: fallbackScores.evalDepth,
          difficultyScore: fallbackScores.evalDifficulty,
          feedback: `[⚡ StudyForge Fast Engine]\n\nSolid focus sprint on ${params.moduleName}. Consistent effort compounds into mastery!`,
          keyUsed: 'Fast Academic Engine',
          modelUsed: 'StudyForge Fast Engine',
          usedFallback: true,
          evaluationMode: 'ai'
        });
      }, 4200); // 4.2-second absolute hard ceiling: NEVER leaves button stuck
    });

    return Promise.race([
      this._executeEvaluation(params),
      hardTimeoutPromise
    ]);
  },

  async _executeEvaluation(params: {
    exam: string;
    subject: string;
    moduleName: string;
    topicName?: string;
    durationMinutes: number;
    notes: string;
  }): Promise<SessionEvaluationResult> {
    const prompt = `You are the StudyForge Academic Evaluator for competitive exams (${params.exam}).
Evaluate this student study session across 10 evaluation criteria based strictly on the CONTENT, depth, accuracy, and conceptual coverage described:
- Subject / Module: ${params.moduleName}
- Specific Topic: ${params.topicName || 'General Practice'}
- Focused Duration: ${params.durationMinutes || 60} minutes (${((params.durationMinutes || 60) / 60).toFixed(2)} hours)
- Student Notes / What was studied: "${params.notes || 'No detailed notes provided'}"

Provide a JSON response rating each criterion from 1 to 10 (1-2 poor/routine, 3-4 below average, 5-6 satisfactory/moderate, 7-8 strong, 9-10 exceptional):
{
  "evalProductivity": (number 1-10: work volume produced relative to personal baseline),
  "evalDifficulty": (number 1-10: intellectual complexity and challenge of material),
  "evalAccuracy": (number 1-10: correctness of facts, calculations, and answers),
  "evalDepth": (number 1-10: thoroughness of conceptual exploration and exceptions),
  "evalMastery": (number 1-10: demonstrated retention and ability to explain without notes),
  "evalApplication": (number 1-10: ability to solve unfamiliar problems or PYQs),
  "evalOutputQuality": (number 1-10: clarity, structure, and revision utility of notes),
  "evalProblemSolving": (number 1-10: reasoned problem-solving rather than rote memorization),
  "evalIndependence": (number 1-10: self-reliance vs dependence on prompts/solutions),
  "evalGoalRelevance": (number 1-10: direct alignment with exam syllabus and score impact),
  "feedback": (concise 1-2 sentence high-yield motivational academic feedback acknowledging specific concepts studied)
}
Return ONLY valid JSON.`;

    const clamp = (val: any, fallback: number) => {
      const n = Number(val);
      return (!isNaN(n) && n >= 1 && n <= 10) ? Math.round(n) : fallback;
    };

    const extractScoresAndXP = (parsed: any) => {
      const scores: EvaluationCriterionScores = {
        evalProductivity: clamp(parsed?.evalProductivity, 6),
        evalDifficulty: clamp(parsed?.evalDifficulty, 7),
        evalAccuracy: clamp(parsed?.evalAccuracy, 7),
        evalDepth: clamp(parsed?.evalDepth, 7),
        evalMastery: clamp(parsed?.evalMastery, 7),
        evalApplication: clamp(parsed?.evalApplication, 6),
        evalOutputQuality: clamp(parsed?.evalOutputQuality, 7),
        evalProblemSolving: clamp(parsed?.evalProblemSolving, 6),
        evalIndependence: clamp(parsed?.evalIndependence, 7),
        evalGoalRelevance: clamp(parsed?.evalGoalRelevance, 8),
      };
      const totalMarks = Object.values(scores).reduce((sum, v) => sum + v, 0);
      const focusedHours = Math.max(0.01, (params.durationMinutes || 60) / 60);
      const xp = Math.max(1, Math.round(focusedHours * totalMarks));
      return { scores, totalMarks, xp };
    };

    let primaryFailureReason = '';

    // TIER 0: Try StudyForge Backend Fast Server Evaluator first!
    // The server has a high-speed direct datacenter connection to Groq (~800ms),
    // eliminates mobile WebView CORS/DNS failures, and hides API keys.
    try {
      const serverController = new AbortController();
      const serverTimeout = setTimeout(() => serverController.abort(), 3500);

      const serverRes = await fetch('https://study-forge-five-pi.vercel.app/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: params.exam,
          moduleName: params.moduleName,
          topicName: params.topicName,
          notes: params.notes,
          durationMinutes: params.durationMinutes,
        }),
        signal: serverController.signal
      });

      clearTimeout(serverTimeout);

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success && serverData.evaluation) {
          const ev = serverData.evaluation;
          const { scores, totalMarks, xp } = extractScoresAndXP(ev.evalScores || ev);
          return {
            ...ev,
            evalScores: scores,
            totalEvalMarks: totalMarks,
            xp: xp || ev.xp,
            depthScore: scores.evalDepth,
            difficultyScore: scores.evalDifficulty,
            evaluationMode: 'ai'
          };
        }
      }
    } catch (err: any) {
      console.warn('[StudyForge AI] Server evaluator unavailable, trying direct:', err?.message);
    }

    // TIER 1: Try Direct Built-in Free Key engine (Groq / Nemotron)
    const freeKeyObj = await this.getOrFetchFreeKey();
    if (freeKeyObj && freeKeyObj.key) {
      const targetEndpoint = freeKeyObj.endpoint || OPENROUTER_CONFIG.endpoint;
      const targetModel = freeKeyObj.model || OPENROUTER_CONFIG.defaultModel;
      const targetLabel = freeKeyObj.label || (freeKeyObj.provider === 'groq' ? '⚡ Groq GPT OSS 120B' : '⚡ NVIDIA Nemotron 3 Ultra 550B');

      try {
        const directController = new AbortController();
        const directTimeout = setTimeout(() => directController.abort(), 3500);

        const reqHeaders: Record<string, string> = {
          'Authorization': `Bearer ${freeKeyObj.key}`,
          'Content-Type': 'application/json'
        };
        if (targetEndpoint.includes('openrouter.ai')) {
          reqHeaders['HTTP-Referer'] = OPENROUTER_CONFIG.siteUrl;
          reqHeaders['X-Title'] = OPENROUTER_CONFIG.siteName;
        }

        const orResponse = await fetch(targetEndpoint, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            model: targetModel,
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
          }),
          signal: directController.signal
        });

        clearTimeout(directTimeout);

        if (orResponse.ok) {
          const orData = await orResponse.json();
          const contentStr = orData?.choices?.[0]?.message?.content;
          if (contentStr) {
            let parsed: any;
            try {
              const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
            } catch {
              parsed = { feedback: contentStr };
            }
            const { scores, totalMarks, xp } = extractScoresAndXP(parsed);
            return {
              xp,
              totalEvalMarks: totalMarks,
              evalScores: scores,
              depthScore: scores.evalDepth,
              difficultyScore: scores.evalDifficulty,
              feedback: `[${targetLabel}]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
              keyUsed: `${targetLabel} (Database)`,
              modelUsed: targetModel,
              usedFallback: false,
              evaluationMode: 'ai'
            };
          }
        } else {
          const errJson = await orResponse.json().catch(() => ({}));
          primaryFailureReason = `${targetLabel} HTTP ${orResponse.status}: ${errJson?.error?.message || orResponse.statusText}`;
          console.warn(`[StudyForge AI] ${targetLabel} primary tier failed: ${primaryFailureReason}. Falling back to personal keys...`);
        }
      } catch (err: any) {
        primaryFailureReason = `${targetLabel} network error (${err?.message || 'Connection failed'})`;
        console.warn(`[StudyForge AI] ${targetLabel} primary tier error: ${primaryFailureReason}. Falling back to personal keys...`);
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
                const { scores, totalMarks, xp } = extractScoresAndXP(parsed);
                return {
                  xp,
                  totalEvalMarks: totalMarks,
                  evalScores: scores,
                  depthScore: scores.evalDepth,
                  difficultyScore: scores.evalDifficulty,
                  feedback: `[⚡ Custom OpenRouter (Nemotron)]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
                  keyUsed: `Personal OpenRouter (${key.slice(0, 8)}...)`,
                  modelUsed: 'NVIDIA Nemotron 3 Ultra 550B (Custom Key)',
                  usedFallback: false,
                  evaluationMode: 'ai'
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
                const { scores, totalMarks, xp } = extractScoresAndXP(parsed);
                return {
                  xp,
                  totalEvalMarks: totalMarks,
                  evalScores: scores,
                  depthScore: scores.evalDepth,
                  difficultyScore: scores.evalDifficulty,
                  feedback: `[✨ Google Gemini 2.5 Flash]\n${parsed.feedback || 'Great session! High retention achieved.'}`,
                  keyUsed: `Personal Gemini Key (${key.slice(0, 8)}...)`,
                  modelUsed: 'Google Gemini 2.5 Flash',
                  usedFallback: false,
                  evaluationMode: 'ai'
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
    const baseMark = noteLen > 150 ? 8 : (noteLen > 60 ? 7 : (noteLen > 20 ? 6 : 5));
    const heuristicScores: EvaluationCriterionScores = {
      evalProductivity: baseMark,
      evalDifficulty: 7,
      evalAccuracy: baseMark,
      evalDepth: noteLen > 30 ? 7 : 5,
      evalMastery: baseMark,
      evalApplication: 6,
      evalOutputQuality: noteLen > 50 ? 7 : 5,
      evalProblemSolving: 6,
      evalIndependence: 7,
      evalGoalRelevance: 8
    };
    const totalMarks = Object.values(heuristicScores).reduce((sum, v) => sum + v, 0);
    const focusedHours = Math.max(0.01, (params.durationMinutes || 60) / 60);
    const contentXp = Math.max(1, Math.round(focusedHours * totalMarks));

    const feedback = `[⚙️ Offline Academic Engine: ${primaryFailureReason ? 'Live AI rate-limited/offline' : 'Connecting to local engine'}]\n\nSolid focus session on ${params.moduleName}. Consistent effort compounds into mastery!`;

    return {
      xp: contentXp,
      totalEvalMarks: totalMarks,
      evalScores: heuristicScores,
      depthScore: heuristicScores.evalDepth,
      difficultyScore: heuristicScores.evalDifficulty,
      feedback,
      keyUsed: 'Offline Heuristic Engine',
      modelUsed: 'Offline Academic Engine',
      apiError: finalFailureReason,
      usedFallback: true,
      evaluationMode: 'ai'
    };
  }
};
