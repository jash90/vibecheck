/**
 * Thin wrapper around Anthropic's Messages API. Never call from the client —
 * this file imports `process.env` and uses the server-side key.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

const UNSAFE_KEYWORDS = [
  // Polish
  'diagnoz',
  'choroba',
  'dieta',
  'kalorie',
  'bmi',
  'waga',
  'anoreksja',
  'anorexia',
  'depresja',
  'leki',
  // English
  'diagnosis',
  'disorder',
  'calorie',
  'weight loss',
  'anorexia',
  'depression',
  'medication',
  'therapy',
];

export interface ClaudeResponse {
  text: string;
  model: string;
  safetyPassed: boolean;
}

export interface ClaudeCallOptions {
  system: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function callClaude({
  system,
  userPrompt,
  maxTokens = 300,
}: ClaudeCallOptions): Promise<ClaudeResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured');
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
    model: string;
  };

  const text = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
    .trim();

  const safetyPassed = isSafeOutput(text);
  return { text, model: data.model ?? MODEL, safetyPassed };
}

export function isSafeOutput(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keyword of UNSAFE_KEYWORDS) {
    if (lower.includes(keyword)) return false;
  }
  return true;
}
