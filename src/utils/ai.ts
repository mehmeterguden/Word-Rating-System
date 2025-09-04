export type AiMode = 'explain' | 'examples' | 'synonyms' | 'followup' | 'full';

interface GenerateParams {
  word: string;
  sourceLanguageName: string; // e.g., English
  targetLanguageName: string; // e.g., Turkish
  targetLanguageCode?: string; // e.g., tr (optional)
  mode: AiMode;
  userQuestion?: string; // for follow-up freeform questions
}

export interface AiResult {
  definition?: string;
  partOfSpeech?: string;
  examples?: Array<{ sentence: string; translation?: string }>;
  synonyms?: string[];
  tips?: string[];
}

const MODEL = 'gemini-2.5-flash';

const buildPrompt = ({ word, sourceLanguageName, targetLanguageName, targetLanguageCode, mode, userQuestion }: GenerateParams) => {
  const outputSchema = `
Return ONLY valid JSON with this structure:
{
  "definition": string,              // concise, in ${targetLanguageName}
  "partOfSpeech": string,           // e.g., noun/verb/adjective
  "examples": [                     // 3-5 examples
    { "sentence": string, "translation": string }
  ],
  "synonyms": string[],             // 5-10 synonyms in ${sourceLanguageName} (if applicable)
  "tips": string[]                  // short learning tips in ${targetLanguageName}
}
`;

  const task =
    mode === 'full'
      ? `Provide a complete learning card for the word "${word}" including definition, part of speech, 3-5 diverse example sentences with ${targetLanguageName} translations, 5-10 high-quality synonyms in ${sourceLanguageName}, and 3-5 short learning tips. Keep explanations in ${targetLanguageName}.`
      : mode === 'explain'
      ? `Explain the word "${word}" clearly and pedagogically.
         Focus on meaning, usage nuances, common collocations, and pitfalls.`
      : mode === 'examples'
      ? `Create natural, diverse example sentences for the word "${word}" across contexts and difficulty levels.`
      : mode === 'synonyms'
      ? `List strong synonyms and near-synonyms for the word "${word}" with nuance notes.`
      : `Answer the user's short follow-up about the word "${word}".
         Keep it concise and helpful. The user's question is: ${userQuestion ?? ''}`;

  return `
You are a great language tutor.
- The user studies ${sourceLanguageName} → ${targetLanguageName}${targetLanguageCode ? ` (target code: ${targetLanguageCode})` : ''}.
- Always write answers in ${targetLanguageName}. When needed, include ${sourceLanguageName} items (e.g., synonyms) but keep explanations in ${targetLanguageName}.
- Be concise, accurate, and helpful.

Task: ${task}

Constraints:
- Keep definitions and tips short and practical.
- Provide example sentences that are natural and level-appropriate.
- Output must be STRICT JSON. Do not include code fences or extra text.

${outputSchema}
`;
};

export async function generateAiContent(params: GenerateParams): Promise<AiResult> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_GEMINI_API_KEY');
  }

  const prompt = buildPrompt(params);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // The model should return pure JSON. Attempt to parse robustly.
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(jsonText) as AiResult;
  return parsed;
}


