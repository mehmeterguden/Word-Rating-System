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
  verbForms?: {
    infinitive: string;
    past: string;
    pastParticiple: string;
    presentParticiple: string;
    thirdPersonSingular: string;
  };
  examples?: Array<{ sentence: string; translation?: string }>;
  synonyms?: Array<{ word: string; isExact: boolean }>;
  antonyms?: Array<{ word: string; isExact: boolean }>;
  tips?: string[];
  wordId?: number; // To track which word this result belongs to
}

const DEFAULT_MODELS = [
  'gemini-2.5-flash-lite', 
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 
  'gemini-2.5-pro', 
];

// Get user selected model from localStorage
const getUserSelectedModel = (): string => {
  try {
    return localStorage.getItem('word-rating-system-ai-model') || 'gemini-2.5-flash-lite';
  } catch {
    return 'gemini-2.5-flash-lite';
  }
};

// Get models array with user selected model first
const getModelsArray = (): string[] => {
  const userSelected = getUserSelectedModel();
  const otherModels = DEFAULT_MODELS.filter(model => model !== userSelected);
  return [userSelected, ...otherModels];
};

// Keep track of which models have been tried
let triedModels = new Set<string>();
let modelSwitchCallback: ((fromModel: string, toModel: string, reason: string) => void) | null = null;

const resetModelTries = () => {
  triedModels.clear();
};

// Function to register model switch callback
export const registerModelSwitchCallback = (callback: (fromModel: string, toModel: string, reason: string) => void) => {
  modelSwitchCallback = callback;
};

// Function to notify model switch
const notifyModelSwitch = (fromModel: string, toModel: string, reason: string) => {
  if (modelSwitchCallback) {
    modelSwitchCallback(fromModel, toModel, reason);
  }
};

// Helper function to log AI response details
const logAiResponse = (model: string, prompt: string, response: string, startTime: number) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate: ~4 chars per token
  const responseTokens = Math.ceil(response.length / 4); // Rough estimate: ~4 chars per token
  const totalTokens = promptTokens + responseTokens;
  
  console.log(`🤖 AI Response Details:`);
  console.log(`   📊 Model: ${model}`);
  console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`   📝 Prompt Tokens: ~${promptTokens}`);
  console.log(`   💬 Response Tokens: ~${responseTokens}`);
  console.log(`   🔢 Total Tokens: ~${totalTokens}`);
  console.log(`   📄 Response Length: ${response.length} characters`);
  console.log(`   📈 Tokens/Second: ${(totalTokens / duration).toFixed(1)}`);
  console.log(`   ──────────────────────────────────────`);
};

const buildPrompt = ({ word, sourceLanguageName, examplesLanguageName, explanationLanguageName, targetLanguageCode, mode, userQuestion }: GenerateParams) => {
  const outputSchema = `
Return ONLY valid JSON with this structure:
{
  "definition": string,              // concise definition in ${explanationLanguageName}
  "partOfSpeech": string,           // e.g., noun/verb/adjective
  "pronunciation": string,          // IPA pronunciation, e.g., /ˈkɒn.tɪn.u.eɪ.tʃər/
  "alternativePronunciation": string, // Alternative pronunciation, e.g., "duh · mand"
  "cefrLevel": string,             // CEFR level, e.g., "A1", "B2", "C1"
  "verbForms": {                    // ONLY include if partOfSpeech is "verb"
    "infinitive": string,           // base form (e.g., "go")
    "past": string,                 // past tense (e.g., "went")
    "pastParticiple": string,       // past participle (e.g., "gone")
    "presentParticiple": string,    // present participle/gerund (e.g., "going")
    "thirdPersonSingular": string   // 3rd person singular (e.g., "goes")
  },
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
         - If the word is a verb, include all verb forms: infinitive, past tense, past participle, present participle, and third person singular
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
You are an expert language tutor specializing in vocabulary learning and word analysis.

LANGUAGE REQUIREMENTS:
- Examples must be in ${examplesLanguageName}
- Explanations/definitions/tips must be in ${explanationLanguageName}${targetLanguageCode ? ` (target code: ${targetLanguageCode})` : ''}
- Include ${sourceLanguageName} items (e.g., synonyms) when asked, but keep explanations in ${explanationLanguageName}

TASK: ${task}

QUALITY STANDARDS:
- Be concise, accurate, and pedagogically sound
- Keep definitions and tips short and practical
- Provide example sentences that are natural and level-appropriate
- Use **bold** formatting for emphasis when needed
- Ensure all word highlighting markers [[w]] and [[/w]] are properly placed

OUTPUT FORMAT:
- Return ONLY valid JSON
- Do not include code fences, markdown, or extra text
- Follow the exact schema structure provided

${outputSchema}
`;
};

export async function generateAiContent(params: GenerateParams): Promise<AiResult> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing REACT_APP_GEMINI_API_KEY');
  }

  const prompt = buildPrompt(params);
  
  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonText = (text || '').trim();
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        if (jsonText.startsWith('```')) {
          const cleaned = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
          const parsed = JSON.parse(cleaned) as AiResult;
          resetModelTries(); // Reset on success
          return parsed;
        }
        
        const parsed = JSON.parse(jsonText) as AiResult;
        resetModelTries(); // Reset on success
        return parsed;
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

// Lightweight chat reply generator, constrained to the current word pair
export async function generateChatReply(params: {
  word1: string; // learning word (text1)
  word2?: string; // translation/paired word (text2)
  chatLanguageName: string; // language to speak in
  userMessage: string;
  sourceLanguageName: string; // user's native language
  targetLanguageName?: string; // language being learned (language of word1)
  conversationStarted?: boolean; // avoid repeated greetings
  conversationContext?: string; // previous conversation summary
}): Promise<string> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing REACT_APP_GEMINI_API_KEY');

  const { word1, word2, chatLanguageName, userMessage, sourceLanguageName, targetLanguageName, conversationStarted, conversationContext } = params;
  
  // Determine the language of word1 (the language being learned)
  const word1Language = targetLanguageName || sourceLanguageName; // fallback to sourceLanguageName if targetLanguageName not provided
  
  const guard = `
You are a friendly, helpful AI assistant chatting with someone who is learning the word "${word1}".

YOUR PERSONALITY:
- Warm, friendly, and conversational
- Knowledgeable and helpful
- Natural and genuine in your responses
- Patient and clear in explanations

CONVERSATION STYLE:
- Respond naturally in ${chatLanguageName}
- Answer the user's question directly and clearly
- Be helpful and informative
- Keep responses SHORT and concise (3-4 sentences maximum)
- Use simple formatting like **bold** for emphasis when needed
- Write in a natural, conversational way
- Don't give long explanations unless specifically asked

CONVERSATION GUIDELINES:
- Answer the user's question directly - don't redirect unnecessarily
- If they ask about "${word1}" or language learning, provide helpful but brief details
- If they ask about other topics, answer naturally and briefly
- Be encouraging and positive
- Keep the conversation flowing naturally
- Don't use special formatting blocks or structured examples
- Just give normal, conversational responses
- Consider the conversation context when responding
- Keep responses under 50 words unless specifically asked for more detail
- DON'T constantly suggest continuing to learn the word - only mention it if the user specifically asks about learning
- DON'T end every response with "we can continue learning" or similar phrases
- It's okay to go off-topic sometimes, but don't force the conversation back to the word
- IMPORTANT: When giving examples, use the language of "${word1}" (${word1Language}), not the user's native language (${sourceLanguageName})
- If the user asks for examples of "${word1}", provide them in ${word1Language} language only
- When giving example sentences, write the ENTIRE sentence in ${word1Language}, not mixed languages
- Examples should be complete sentences in ${word1Language} language only
- Use **bold** for emphasis when needed
- Use line breaks (\\n) for better readability where appropriate
${conversationStarted ? '- Continue naturally without greetings' : '- Start with a warm, friendly greeting'}
`;

  const prompt = `${guard}

CHAT CONTEXT:
- Language: ${chatLanguageName}
- Current Learning Focus: "${word1}" (in ${word1Language} language)
- Translation: ${word2 ? `"${word2}"` : 'Not provided'}
- User's Language: ${sourceLanguageName}
- Language Being Learned: ${word1Language} (this is the language of "${word1}")
${conversationContext ? `- Previous Conversation: ${conversationContext}` : ''}

User: ${userMessage}

AI Assistant:`;
  
  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        resetModelTries(); // Reset on success
        return (text || '').trim();
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

// Multilingual greeting; uses presets for common languages, otherwise asks the model
export async function generateChatGreeting(params: {
  word1: string;
  chatLanguageName: string;
  sourceLanguageName?: string; // user's native language
  targetLanguageName?: string; // language being learned (language of word1)
}): Promise<string> {
  const { word1, chatLanguageName, sourceLanguageName, targetLanguageName } = params;
  
  // Determine the language of word1 (the language being learned)
  const word1Language = targetLanguageName || sourceLanguageName || 'the target language';
  const presets: Record<string, string> = {
    English: `Hi! Let’s work on **${word1}** together. What would you like to try first?`,
    Turkish: `Merhaba! **${word1}** üzerine birlikte çalışalım. Önce neye bakalım?`,
    Russian: `Привет! Давай поработаем над **${word1}**. С чего начнём?`,
    Spanish: `¡Hola! Practiquemos **${word1}** juntos. ¿Por dónde empezamos?`,
    French: `Salut ! Travaillons **${word1}** ensemble. On commence par quoi ?`,
    German: `Hallo! Lass uns gemeinsam **${word1}** üben. Womit fangen wir an?`
  };
  if (presets[chatLanguageName]) return presets[chatLanguageName];

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) return presets['English'];

  const prompt = `You are a friendly AI assistant. Write a simple greeting in ${chatLanguageName} for someone learning the word "${word1}" in ${word1Language}.

Your greeting should:
- Be simple and friendly
- Say you're here to help with anything, especially with **${word1}**
- Ask how you can help them
- Keep it short and natural (under 20 words)
- Use **bold** for the word "${word1}" (not "word" or "kelime")
- Use line breaks (\\n) where appropriate for better readability
- No special formatting or emojis

Make it feel friendly and helpful.`;
  
  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || presets['English'];
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        resetModelTries(); // Reset on success
        return (text || presets['English']).trim();
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      
      // For other errors, return preset
      return presets['English'];
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      return presets['English'];
    }
  }
  
  // If we've tried all models and still failed
  return presets['English'];
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

  const { word, examplesLanguageName, explanationLanguageName } = params;
  const prompt = `You are a helpful language tutor. The user is learning the word "${word}".
- Examples (if referenced) are in ${examplesLanguageName}.
- Provide a detailed, beginner-friendly definition in ${explanationLanguageName}.
- Include: meaning, part of speech, common usage contexts, and any important nuances.
- Make it comprehensive but still accessible for language learners.
- Aim for 3-4 sentences that cover the word thoroughly.
- Avoid extra commentary, focus on the word itself.
Return ONLY valid JSON like: { "definition": string }`;

  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let jsonText = (text || '').trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(jsonText) as { definition?: string };
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        resetModelTries(); // Reset on success
        return parsed.definition || '';
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        
        // Notify model switch
        const nextModel = MODELS[MODELS.indexOf(model) + 1];
        if (nextModel) {
          notifyModelSwitch(model, nextModel, "Rate limit exceeded - switching to backup model");
        }
        
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

