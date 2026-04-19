/**
 * Thin wrapper around OpenAI's Chat Completions API. Never call from the
 * client — this file imports `process.env` and uses the server-side key.
 *
 * Kept intentionally minimal: a single `callOpenAi({ system, userPrompt })`
 * helper that mirrors the old Claude wrapper so swapping providers was a
 * one-line change at the call site.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

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

export interface OpenAiResponse {
  text: string;
  model: string;
  safetyPassed: boolean;
}

export interface OpenAiCallOptions {
  system: string;
  userPrompt: string;
  maxTokens?: number;
  /** ISO 639-1 locale like 'pl', 'en'. Appended to system prompt as a firm
   * instruction so output is in the user's language. Defaults to 'pl'. */
  locale?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  uk: 'Ukrainian',
};

function languageInstruction(locale?: string): string {
  const code = (locale ?? 'pl').slice(0, 2).toLowerCase();
  const name = LANGUAGE_NAMES[code] ?? 'Polish';
  return `Respond strictly in ${name}. Do not mix languages. Match the user's tone.`;
}

export async function callOpenAi({
  system,
  userPrompt,
  maxTokens = 300,
  locale,
}: OpenAiCallOptions): Promise<OpenAiResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemWithLang = `${system}\n\n${languageInstruction(locale)}`;

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemWithLang },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string | null } }[];
  };

  const text = (data.choices?.[0]?.message?.content ?? '').trim();
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
