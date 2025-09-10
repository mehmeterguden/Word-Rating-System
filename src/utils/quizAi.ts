import { getApiKey } from './apiKeys';

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: QuizOption[];
  difficulty: number;
}

interface GenerateQuizOptionsParams {
  word: string;
  correctAnswer: string;
  sourceLanguageName: string;
  targetLanguageName: string;
  explanationLanguageName: string;
  difficulty: number;
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

const resetModelTries = () => {
  triedModels.clear();
};

// Helper function to log AI response details
const logAiResponse = (model: string, prompt: string, response: string, startTime: number) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate: ~4 chars per token
  const responseTokens = Math.ceil(response.length / 4); // Rough estimate: ~4 chars per token
  const totalTokens = promptTokens + responseTokens;
  
  console.log(`🤖 Quiz AI Response Details:`);
  console.log(`   📊 Model: ${model}`);
  console.log(`   ⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`   📝 Prompt Tokens: ~${promptTokens}`);
  console.log(`   💬 Response Tokens: ~${responseTokens}`);
  console.log(`   🔢 Total Tokens: ~${totalTokens}`);
  console.log(`   📄 Response Length: ${response.length} characters`);
  console.log(`   📈 Tokens/Second: ${(totalTokens / duration).toFixed(1)}`);
  console.log(`   ──────────────────────────────────────`);
};

const buildQuizPrompt = ({ 
  word, 
  correctAnswer, 
  sourceLanguageName, 
  targetLanguageName, 
  explanationLanguageName, 
  difficulty 
}: GenerateQuizOptionsParams) => {
  const outputSchema = `
Return ONLY valid JSON with this structure:
{
  "options": [
    {
      "text": string,           // The option text in ${targetLanguageName}
      "isCorrect": boolean      // true for the correct answer, false for wrong options
    }
  ]
}`;

  const difficultyDescription = 
    difficulty <= 2 ? "very easy and basic" :
    difficulty <= 3 ? "easy and common" :
    difficulty <= 4 ? "intermediate" :
    "advanced and complex";

  const task = `Create 4 multiple choice options (A, B, C, D) for a quiz question about the word "${word}" (in ${targetLanguageName}).
  
The correct answer is: "${correctAnswer}" (in ${sourceLanguageName})

FOCUS: Generate ONLY similar words that could genuinely confuse learners - NO explanations needed.

CREATION STRATEGY:
- Create 3 sophisticated wrong options that are ${difficultyDescription} level and could genuinely confuse learners
- Focus on generating words that are similar to the correct answer in various ways:

SIMILARITY TYPES TO USE:
- Phonetically similar words (sound alike)
- Visually similar words (look alike when written)
- Semantically similar words (related meanings)
- Categorically similar words (same category, different specific meaning)
- Grammatically similar words (same word type, different meaning)
- Common learner confusion words
- False cognates or similar-looking words from other languages

DIFFICULTY ADAPTATION:
- For easy levels: Use obviously different but commonly confused words
- For medium levels: Use subtly different words that require careful reading
- For hard levels: Use very similar words that require deep understanding

QUALITY STANDARDS:
- All options must be grammatically correct in ${targetLanguageName}
- Wrong options should be plausible and realistic
- The correct answer should be clearly the best choice upon reflection
- Avoid obviously wrong or nonsensical options
- Make the quiz challenging but fair
- Focus on generating words that test vocabulary knowledge and recognition

EXAMPLES OF SIMILAR WORDS TO GENERATE:
- For "apple" → "apricot", "peach", "pear" (similar fruits)
- For "happy" → "happily", "happiness", "joyful" (related words)
- For "house" → "home", "building", "apartment" (similar concepts)
- For "cat" → "car", "cap", "cut" (similar spelling/sound)`;

  return `
You are an expert language learning quiz creator with deep understanding of second language acquisition, cognitive psychology, and common learner error patterns. You specialize in creating sophisticated, educational multiple choice questions that genuinely test and improve language learning.

EXPERTISE AREAS:
- Second Language Acquisition (SLA) research
- Common learner error patterns and confusion points
- Cognitive load theory in language learning
- Cross-linguistic influence and transfer effects
- Vocabulary acquisition strategies
- Context-dependent language understanding

LANGUAGE REQUIREMENTS:
- Quiz options must be in ${targetLanguageName}
- Use natural, authentic language appropriate for the difficulty level
- Generate ONLY words - no explanations or additional text

TASK: ${task}

${outputSchema}
`;
};

export async function generateQuizOptions(params: GenerateQuizOptionsParams): Promise<QuizOption[]> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please configure it in Settings.');
  }

  const prompt = buildQuizPrompt(params);
  
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
          const parsed = JSON.parse(cleaned) as { options: QuizOption[] };
          resetModelTries(); // Reset on success
          return parsed.options || [];
        }
        
        const parsed = JSON.parse(jsonText) as { options: QuizOption[] };
        resetModelTries(); // Reset on success
        return parsed.options || [];
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

export async function generateQuizQuestion(
  word: string,
  correctAnswer: string,
  sourceLanguageName: string,
  targetLanguageName: string,
  explanationLanguageName: string,
  difficulty: number
): Promise<QuizQuestion> {
  try {
    // Validate inputs
    if (!word || !correctAnswer) {
      throw new Error('Word and correct answer are required');
    }

    if (!sourceLanguageName || !targetLanguageName) {
      throw new Error('Source and target languages are required');
    }

    const options = await generateQuizOptions({
      word,
      correctAnswer,
      sourceLanguageName,
      targetLanguageName,
      explanationLanguageName,
      difficulty: difficulty || 2
    });

    // Ensure we have exactly 4 options and one is correct
    if (!options || options.length !== 4) {
      throw new Error(`Expected exactly 4 options, got ${options?.length || 0}`);
    }

    const correctOptions = options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error(`Expected exactly 1 correct option, got ${correctOptions.length}`);
    }

    // Validate that all options have text
    const invalidOptions = options.filter(opt => !opt.text || opt.text.trim() === '');
    if (invalidOptions.length > 0) {
      throw new Error('All options must have valid text');
    }

    return {
      word,
      correctAnswer,
      options,
      difficulty: difficulty || 2
    };
  } catch (error) {
    console.error('Error generating quiz question:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('API key is missing or invalid. Please check your settings.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please try again in a few moments.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(`Quiz generation failed: ${error.message}`);
      }
    }
    
    throw new Error('An unexpected error occurred while generating the quiz question.');
  }
}

export async function generateQuizWords(
  count: number,
  usedWordIds: Set<number>,
  availableWords: Array<{ id: number; text1: string; text2: string; difficulty: number }>,
  sourceLanguageName: string,
  targetLanguageName: string
): Promise<Array<{ id: number; text1: string; text2: string; difficulty: number }>> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please configure it in Settings.');
  }

  // Get unused words
  const unusedWords = availableWords.filter(word => !usedWordIds.has(word.id));
  
  if (unusedWords.length === 0) {
    return [];
  }

  // If we have enough unused words, just return them
  if (unusedWords.length <= count) {
    return unusedWords;
  }

  // Create a prompt to select the best words for quiz
  const wordList = unusedWords.map(word => 
    `ID: ${word.id}, ${sourceLanguageName}: "${word.text1}", ${targetLanguageName}: "${word.text2}", Difficulty: ${word.difficulty}`
  ).join('\n');

  const prompt = `You are an expert language learning quiz curator. Select ${count} words from the available word list that would create the most effective and engaging quiz experience.

Available words:
${wordList}

Selection criteria:
- Choose words with varied difficulty levels (mix of easy, medium, hard)
- Prioritize words that are commonly used and practical
- Ensure good distribution across different difficulty levels
- Select words that would create interesting quiz questions
- Avoid words that are too similar to each other

Return ONLY a JSON array of the selected word IDs in this format:
[1, 5, 12, 23, 45]

Do not include any other text or explanation.`;

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
        
        let selectedIds: number[];
        
        if (jsonText.startsWith('```')) {
          const cleaned = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
          selectedIds = JSON.parse(cleaned);
        } else {
          selectedIds = JSON.parse(jsonText);
        }
        
        // Filter and return the selected words
        const selectedWords = unusedWords.filter(word => selectedIds.includes(word.id));
        
        resetModelTries(); // Reset on success
        return selectedWords.slice(0, count);
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed, fallback to random selection
  console.log('AI word selection failed, using random selection');
  const shuffled = [...unusedWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function generateHint(
  word: string,
  sourceLanguageName: string,
  explanationLanguageName: string
): Promise<string> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please configure it in Settings.');
  }

  const prompt = `You are a helpful language learning assistant. Provide a short, simple explanation of the word "${word}" in ${sourceLanguageName} using ${explanationLanguageName}. 

Requirements:
- Keep it very brief (1-2 sentences maximum)
- Use simple, clear language
- Focus on the most important meaning
- Don't give away the translation directly
- Make it helpful for learning

Example format: "A small, round fruit that grows on trees and is often red or green."

Word: "${word}"
Language: ${sourceLanguageName}
Explanation in: ${explanationLanguageName}

Provide only the explanation, no additional text:`;

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
        const hint = text.trim();
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        resetModelTries(); // Reset on success
        return hint;
      }
      
      // If we get a rate limit error, try the next model
      if (res.status === 429) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      
      // For other errors, throw immediately
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

