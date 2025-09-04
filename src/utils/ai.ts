export type AiMode = 'explain' | 'examples' | 'synonyms' | 'followup' | 'full';

interface GenerateParams {
  word: string;
  // The user's known language (used for synonyms or translations labels if needed)
  sourceLanguageName: string;
  // The language of the word being learned (the first word's language) — examples should be in this language
  examplesLanguageName: string;
  // The language in which explanations/definitions/tips should be written (from Settings)
  explanationLanguageName: string;
  targetLanguageCode?: string; // optional BCP-47 code if needed for TTS in the UI
  mode: AiMode;
  userQuestion?: string; // for follow-up freeform questions
}

export interface AiResult {
  definition?: string;
  partOfSpeech?: string;
  pronunciation?: string;
  alternativePronunciation?: string;
  cefrLevel?: string; // Added CEFR level
  examples?: Array<{ sentence: string; translation?: string }>;
  synonyms?: Array<{ word: string; isExact: boolean }>;
  antonyms?: Array<{ word: string; isExact: boolean }>;
  tips?: string[];
}

const MODEL = 'gemini-2.5-flash';

const buildPrompt = ({ word, sourceLanguageName, examplesLanguageName, explanationLanguageName, targetLanguageCode, mode, userQuestion }: GenerateParams) => {
  const outputSchema = `
Return ONLY valid JSON with this structure:
{
  "definition": string,              // concise, in ${explanationLanguageName}
  "partOfSpeech": string,           // e.g., noun/verb/adjective
  "pronunciation": string,          // IPA pronunciation, e.g., /ˈkɒn.tɪn.u.eɪ.tʃər/
  "alternativePronunciation": string, // Alternative pronunciation, e.g., "duh · mand"
  "cefrLevel": string,             // CEFR level, e.g., "A1", "B2", "C1"
  "examples": [                     // 3-5 examples
    { "sentence": string, "translation": string } // IMPORTANT: wrap every occurrence of the target word in the sentence with [[w]] and [[/w]] markers.
  ],
  "synonyms": [                     // 5-10 synonyms in ${examplesLanguageName} (the target word's language)
    { "word": string, "isExact": boolean } // isExact: true for exact synonyms, false for similar meanings
  ],
  "antonyms": [                     // 5-10 antonyms in ${examplesLanguageName} (the target word's language)
    { "word": string, "isExact": boolean } // isExact: true for exact antonyms, false for opposite meanings
  ],
  "tips": string[]                  // short learning tips in ${explanationLanguageName}
}
`;

  const task =
    mode === 'full'
      ? `Teach the user the word "${word}" as if it's their first time. Provide a complete learning card including:
         - A clear, beginner-friendly definition in ${explanationLanguageName} (1-3 sentences). Include the core meaning and a tiny nuance/pitfall if important. Use **bold** for important terms or related words.
         - Part of speech in both ${explanationLanguageName} and ${examplesLanguageName} (e.g., "Noun (İsim)" or "Verb (Fiil)")
         - Realistic CEFR level (A1 for basic words like "hello", "cat"; A2 for common words like "house", "work"; B1 for intermediate words like "achieve", "consider"; B2 for advanced words like "accomplish", "endeavor"; C1 for complex words like "arbitrary", "elaborate"; C2 for very advanced words like "ubiquitous", "ephemeral")
         - Pronunciation in IPA (International Phonetic Alphabet) if the word is in English or another language where IPA is commonly used
         - Alternative pronunciation in a more readable format (e.g., "duh · mand" for "demand")
         - 3-5 graded example sentences (from easy to harder) in ${examplesLanguageName} with ${explanationLanguageName} translations where needed. In each example sentence, wrap every occurrence of "${word}" with [[w]] and [[/w]] markers for highlighting.
         - 5-10 synonyms in ${examplesLanguageName} (mark exact synonyms vs similar meanings)
         - 5-10 antonyms in ${examplesLanguageName} (mark exact antonyms vs opposite meanings)
         - 3-5 short, practical learning tips. Use **bold** for important terms or key concepts.
         Keep explanations in ${explanationLanguageName}. Focus on clarity and learning.`
      : mode === 'explain'
      ? `Explain the word "${word}" clearly and pedagogically in ${explanationLanguageName}.
         Focus on meaning, usage nuances, common collocations, and pitfalls.`
      : mode === 'examples'
      ? `Create natural, diverse example sentences for the word "${word}" across contexts and difficulty levels. Sentences must be in ${examplesLanguageName}. Provide translations in ${explanationLanguageName}. Wrap every occurrence of "${word}" in each sentence with [[w]] and [[/w]] markers.`
      : mode === 'synonyms'
      ? `List synonyms and antonyms for the word "${word}" in ${examplesLanguageName} with nuance notes (explanations in ${explanationLanguageName}).`
      : `Answer the user's short follow-up about the word "${word}".
         Keep it concise and helpful. Provide the explanation in ${explanationLanguageName}. The user's question is: ${userQuestion ?? ''}`;

  return `
You are a great language tutor.
- Examples must be in ${examplesLanguageName}. Explanations/definitions/tips must be in ${explanationLanguageName}${targetLanguageCode ? ` (target code: ${targetLanguageCode})` : ''}.
- Include ${sourceLanguageName} items (e.g., synonyms) when asked, but keep explanations in ${explanationLanguageName}.
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

// Lightweight chat reply generator, constrained to the current word pair
export async function generateChatReply(params: {
  word1: string; // learning word (text1)
  word2?: string; // translation/paired word (text2)
  chatLanguageName: string; // language to speak in
  userMessage: string;
  sourceLanguageName: string; // known language (for occasional labels if needed)
  conversationStarted?: boolean; // avoid repeated greetings
}): Promise<string> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing REACT_APP_GEMINI_API_KEY');

  const { word1, word2, chatLanguageName, userMessage, sourceLanguageName, conversationStarted } = params;
  const guard = `
You are a focused language tutor.
- ONLY discuss the single target word "${word1}". Do NOT discuss other topics or other words unless strictly necessary to explain this word.
- If the user asks about unrelated topics, reply briefly and politely redirect to "${word1}".
- Be concise, didactic, and supportive. Use ${chatLanguageName} for your reply.
- You may provide tiny labels in ${sourceLanguageName} if necessary, but keep the main text in ${chatLanguageName}.

Style:
- Keep a natural chat tone. Use short paragraphs.
- Use simple inline emphasis like **bold** when needed.
- ONLY when the user asks for examples/tips or when clearly helpful, append a small structured block using fenced code blocks:
  \`\`\`examples
  - example sentence 1
  - example sentence 2
  \`\`\`
  \`\`\`tips
  - short tip 1
  - short tip 2
  \`\`\`
Do not include any other code blocks.
${conversationStarted ? '- Do NOT start with greetings; continue the conversation naturally.' : ''}
`;

  const prompt = `${guard}\n\nConversation language: ${chatLanguageName}\nTarget word: ${word1}\n\nUser: ${userMessage}\nTutor:`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return (text || '').trim();
}

// Multilingual greeting; uses presets for common languages, otherwise asks the model
export async function generateChatGreeting(params: {
  word1: string;
  chatLanguageName: string;
}): Promise<string> {
  const { word1, chatLanguageName } = params;
  const presets: Record<string, string> = {
    English: `Hello! We can chat here. I can help you with the word "${word1}". How can I help?`,
    Turkish: `Merhaba! Buradan sohbet edebiliriz. "${word1}" kelimesi hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?`,
    Russian: `Здравствуйте! Мы можем поболтать здесь. Я могу помочь с словом «${word1}». Чем могу помочь?`,
    Spanish: `¡Hola! Podemos chatear aquí. Puedo ayudarte con la palabra "${word1}". ¿Cómo puedo ayudar?`,
    French: `Bonjour ! Nous pouvons discuter ici. Je peux vous aider avec le mot « ${word1} ». Comment puis-je aider ?`,
    German: `Hallo! Wir können hier chatten. Ich kann dir mit dem Wort „${word1}“ helfen. Wie kann ich helfen?`
  };
  if (presets[chatLanguageName]) return presets[chatLanguageName];

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) return presets['English'];

  const prompt = `Write a short friendly greeting in ${chatLanguageName} that says we can chat here and that I can help with the word "${word1}". End with a brief question like "How can I help?". Keep under 25 words.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) return presets['English'];
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || presets['English'];
  return (text || presets['English']).trim();
}

// Fetch only a concise definition in a specific explanation language
export async function generateDefinitionOnly(params: {
  word: string;
  examplesLanguageName: string; // language of the word being learned (for context)
  explanationLanguageName: string; // language to output the definition in
  sourceLanguageName: string; // user's known language (for hints if needed)
}): Promise<string> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing REACT_APP_GEMINI_API_KEY');

  const { word, examplesLanguageName, explanationLanguageName, sourceLanguageName } = params;
  const prompt = `You are a helpful language tutor. The user is learning the word "${word}".
- Examples (if referenced) are in ${examplesLanguageName}.
- Provide ONLY a concise, beginner-friendly definition in ${explanationLanguageName}.
- Keep it to one or two short sentences. Avoid extra commentary.
Return ONLY valid JSON like: { "definition": string }`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let jsonText = (text || '').trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
  }
  const parsed = JSON.parse(jsonText) as { definition?: string };
  return parsed.definition || '';
}

