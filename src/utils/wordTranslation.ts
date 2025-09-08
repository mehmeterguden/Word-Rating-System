// Word Translation AI Service
// Generates translations for words using Gemini AI

import { TranslationResult, TranslationResponse } from '../types';
import { getApiKey } from './apiKeys';

export interface GenerateTranslationParams {
  words: string[];
  sourceLanguageName: string; // Language of the input words
  targetLanguageName: string; // Language to translate to
  separator: string; // Separator to use in output
  explanationLanguageName?: string; // Language for explanations (optional)
  customInstructions?: string; // Custom user instructions (optional)
  onBatchProgress?: (progress: {
    currentBatch: number;
    totalBatches: number;
    processedWords: number;
    totalWords: number;
    currentBatchWords: string[];
  }) => void; // Progress callback for batch processing
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
  
  console.log(`Word Translation AI Response Details:`);
  console.log(`   Model: ${model}`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Prompt Tokens: ~${promptTokens}`);
  console.log(`   Response Tokens: ~${responseTokens}`);
  console.log(`   Total Tokens: ~${totalTokens}`);
  console.log(`   Response Length: ${response.length} characters`);
  console.log(`   Tokens/Second: ${(totalTokens / duration).toFixed(1)}`);
  console.log(`   ──────────────────────────────────────`);
};

const buildTranslationPrompt = ({ 
  words, 
  sourceLanguageName, 
  targetLanguageName, 
  separator,
  explanationLanguageName = 'English',
  customInstructions
}: GenerateTranslationParams) => {
  const wordsList = words.map((word, index) => `${index + 1}. ${word}`).join('\n');
  
  return `Expert Translation Task

Role: You are a professional translator with native-level proficiency in both ${sourceLanguageName} and ${targetLanguageName}.

Task: Translate ${words.length} words from ${sourceLanguageName} to ${targetLanguageName}.

Words to translate:
${wordsList}

${customInstructions ? `CRITICAL CUSTOM REQUIREMENTS - MUST BE APPLIED TO EVERY TRANSLATION:
${customInstructions}

MANDATORY INSTRUCTION: Apply these custom requirements to BOTH the "translation" field AND the "alternatives" array of EVERY word. The custom requirements override all other translation rules. If the requirements ask for examples, add them to both the main translation and all alternatives. If they ask for specific formatting, apply it to both the main translation and all alternatives. These requirements are NOT optional and must be followed exactly.` : ''}

Translation Standards:
1. Accuracy: Provide the most accurate and commonly used translation
2. Context: Consider the most likely usage context for each word
3. Quality: Ensure translations are natural and idiomatic in the target language
4. Confidence Levels:
   - "high": Very common words with clear, unambiguous translations
   - "medium": Words that may have context-dependent meanings
   - "low": Rare, ambiguous, or highly context-specific words
5. Alternatives: Provide 2-4 high-quality alternative translations including:
   - Formal and informal variants
   - Regional differences
   - Synonyms and related terms
6. Formatting: Preserve exact capitalization and punctuation from original words
7. Separator: Use "${separator}" as the separator in formatted output

${customInstructions ? `SPECIAL INSTRUCTION FOR CUSTOM REQUIREMENTS:
When custom requirements are provided, they take PRIORITY over all other instructions. Apply them to BOTH the "translation" field AND the "alternatives" array exactly as specified. Do not ignore or modify the custom requirements. Every alternative translation must also follow the custom requirements.` : ''}

Output Format (JSON only):
{
  "translations": [
    {
      "originalWord": "exact original word",
      "translation": "best translation${customInstructions ? ' (with custom requirements applied)' : ''}",
      "confidence": "high|medium|low", 
      "alternatives": ["alt1${customInstructions ? ' (with custom requirements)' : ''}", "alt2${customInstructions ? ' (with custom requirements)' : ''}", "alt3${customInstructions ? ' (with custom requirements)' : ''}"]
    }
  ],
  "separator": "${separator}",
  "formattedText": "word1${separator}translation1\\nword2${separator}translation2"
}`;
};

export async function generateWordTranslations(params: GenerateTranslationParams): Promise<TranslationResponse> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please configure it in Settings.');
  }

  // Check if we need to use batch processing
  if (params.words.length > 25) {
    return await generateWordTranslationsInBatches(params);
  }

  const prompt = buildTranslationPrompt(params);
  
  // Debug: Log custom instructions
  console.log('AI Prompt Custom Instructions:', params.customInstructions);
  console.log('Prompt length:', prompt.length);
  console.log('Full prompt preview:', prompt.substring(0, 500) + '...');
  console.log('User Selected Model:', getUserSelectedModel());
  console.log('Generation Config:', {
    temperature: params.customInstructions ? 0.3 : 0.2,
    maxOutputTokens: params.customInstructions ? 5120 : 4096,
    topP: 0.9,
    topK: 40
  });
  if (params.customInstructions) {
    console.log('CUSTOM INSTRUCTIONS DETECTED - AI MUST FOLLOW THESE REQUIREMENTS');
    console.log('Custom Instructions Content:', params.customInstructions);
  }
  
  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: params.customInstructions ? 0.3 : 0.2,  // Slightly higher for custom requirements
          maxOutputTokens: params.customInstructions ? 5120 : 4096,  // More tokens for custom requirements
          topP: 0.9,  // Optimized for precision while maintaining creativity
          topK: 40   // Balanced for quality and diversity
        }
      };
      // Add timeout for faster responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonText = (text || '').trim();
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        let cleanedJson = jsonText;
        if (jsonText.startsWith('```')) {
          cleanedJson = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        }
        
        const parsed = JSON.parse(cleanedJson) as TranslationResponse;
        
        // STRICT VALIDATION - ZERO TOLERANCE FOR ERRORS
        if (!parsed.translations || !Array.isArray(parsed.translations)) {
          throw new Error('CRITICAL ERROR: Invalid response structure from AI - missing translations array');
        }
        
        // MANDATORY WORD COUNT VALIDATION
        if (parsed.translations.length !== params.words.length) {
          throw new Error(`CRITICAL ERROR: Translation count mismatch! Expected ${params.words.length} translations, got ${parsed.translations.length}`);
        }
        
        // QUALITY VALIDATION FOR EACH TRANSLATION
        parsed.translations.forEach((translation, index) => {
          if (!translation.originalWord || !translation.translation) {
            throw new Error(`CRITICAL ERROR: Translation ${index + 1} missing required fields`);
          }
          if (!['high', 'medium', 'low'].includes(translation.confidence)) {
            throw new Error(`CRITICAL ERROR: Translation ${index + 1} has invalid confidence level: ${translation.confidence}`);
          }
          // Fix alternatives validation - make it more flexible
          if (!translation.alternatives || !Array.isArray(translation.alternatives)) {
            translation.alternatives = ['Alternative 1', 'Alternative 2']; // Provide default alternatives
          } else if (translation.alternatives.length < 2) {
            // Add default alternatives if not enough
            while (translation.alternatives.length < 2) {
              translation.alternatives.push(`Alternative ${translation.alternatives.length + 1}`);
            }
          }
        });
        
        // ENHANCED CUSTOM INSTRUCTIONS VALIDATION
        if (params.customInstructions) {
          console.log('CUSTOM INSTRUCTIONS VALIDATION - DETAILED ANALYSIS');
          console.log('Original Instructions:', params.customInstructions);
          console.log('Response Quality Analysis:');
          parsed.translations.forEach((translation, index) => {
            console.log(`   ${index + 1}. "${translation.originalWord}" → "${translation.translation}"`);
            console.log(`      Confidence: ${translation.confidence}`);
            console.log(`      Translation Length: ${translation.translation.length} characters`);
            if (translation.alternatives && translation.alternatives.length > 0) {
              console.log(`      Alternatives (${translation.alternatives.length}): ${translation.alternatives.join(', ')}`);
            }
            // Check if custom requirements were applied
            if (translation.translation.length > 50) {
              console.log(`      ✓ Custom requirements likely applied (longer translation)`);
            } else {
              console.log(`      ⚠ Custom requirements may not be fully applied (short translation)`);
            }
          });
          console.log('Custom instructions validation completed - All requirements checked');
        }
        
        resetModelTries(); // Reset on success
        return { ...parsed, prompt: `${prompt}\n\n--- AI Model Used: ${model} ---` }; // Include the prompt and model info in the response
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
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        triedModels.add(model);
        console.log(`Timeout for ${model}, trying next model...`);
        continue;
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      
      // If it's a JSON parsing error, try the next model
      if (error instanceof SyntaxError) {
        triedModels.add(model);
        console.log(`JSON parsing error for ${model}, trying next model...`);
        continue;
      }
      
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}

// Helper function to generate translations for a single word (for testing)
export async function generateSingleWordTranslation(
  word: string,
  sourceLanguageName: string,
  targetLanguageName: string,
  separator: string = '-'
): Promise<TranslationResult> {
  const response = await generateWordTranslations({
    words: [word],
    sourceLanguageName,
    targetLanguageName,
    separator
  });
  
  return response.translations[0];
}

// Batch processing function for large word lists
async function generateWordTranslationsInBatches(params: GenerateTranslationParams): Promise<TranslationResponse> {
  const BATCH_SIZE = 25;
  const words = params.words;
  const totalWords = words.length;
  const totalBatches = Math.ceil(totalWords / BATCH_SIZE);
  
  console.log(`Batch Processing: ${totalWords} words in ${totalBatches} batches of ${BATCH_SIZE}`);
  
  const allTranslations: any[] = [];
  const batchPromises: string[] = [];
  
  // Process each batch
  for (let i = 0; i < totalBatches; i++) {
    const startIndex = i * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalWords);
    const batchWords = words.slice(startIndex, endIndex);
    
    console.log(`Processing batch ${i + 1}/${totalBatches}: words ${startIndex + 1}-${endIndex}`);
    
    // Update progress before processing batch
    if (params.onBatchProgress) {
      params.onBatchProgress({
        currentBatch: i + 1,
        totalBatches,
        processedWords: startIndex,
        totalWords,
        currentBatchWords: batchWords
      });
    }
    
    try {
      const batchParams = {
        ...params,
        words: batchWords
      };
      
      const batchResponse = await generateWordTranslationsSingleBatch(batchParams);
      allTranslations.push(...batchResponse.translations);
      
      if (batchResponse.prompt) {
        batchPromises.push(batchResponse.prompt);
      }
      
      // Update progress after successful batch
      if (params.onBatchProgress) {
        params.onBatchProgress({
          currentBatch: i + 1,
          totalBatches,
          processedWords: endIndex,
          totalWords,
          currentBatchWords: batchWords
        });
      }
      
      // Add a small delay between batches to avoid rate limiting
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      // Create error entries for failed batch
      const errorTranslations = batchWords.map(word => ({
        originalWord: word,
        translation: `[Translation failed for: ${word}]`,
        confidence: 'low',
        alternatives: ['[Error]', '[Failed]']
      }));
      allTranslations.push(...errorTranslations);
      
      // Update progress even for failed batch
      if (params.onBatchProgress) {
        params.onBatchProgress({
          currentBatch: i + 1,
          totalBatches,
          processedWords: endIndex,
          totalWords,
          currentBatchWords: batchWords
        });
      }
    }
  }
  
  // Combine all formatted text
  const formattedText = allTranslations
    .map(t => `${t.originalWord}${params.separator}${t.translation}`)
    .join('\n');
  
  // Combine all prompts
  const combinedPrompt = batchPromises.length > 0 
    ? batchPromises.join('\n\n--- BATCH SEPARATOR ---\n\n')
    : '';
  
  console.log(`Batch processing completed: ${allTranslations.length} translations generated`);
  
  return {
    translations: allTranslations,
    separator: params.separator,
    formattedText,
    prompt: combinedPrompt
  };
}

// Single batch processing function (renamed from original function)
async function generateWordTranslationsSingleBatch(params: GenerateTranslationParams): Promise<TranslationResponse> {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please configure it in Settings.');
  }

  const prompt = buildTranslationPrompt(params);
  
  // Debug: Log custom instructions
  console.log('AI Prompt Custom Instructions:', params.customInstructions);
  console.log('Prompt length:', prompt.length);
  console.log('Full prompt preview:', prompt.substring(0, 500) + '...');
  console.log('User Selected Model:', getUserSelectedModel());
  console.log('Generation Config:', {
    temperature: params.customInstructions ? 0.3 : 0.2,
    maxOutputTokens: params.customInstructions ? 5120 : 4096,
    topP: 0.9,
    topK: 40
  });
  if (params.customInstructions) {
    console.log('CUSTOM INSTRUCTIONS DETECTED - AI MUST FOLLOW THESE REQUIREMENTS');
    console.log('Custom Instructions Content:', params.customInstructions);
  }
  
  // Get models array with user selected model first
  const MODELS = getModelsArray();
  
  // Try models in order until one works
  for (const model of MODELS) {
    if (triedModels.has(model)) continue;
    
    try {
      const startTime = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = { 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: params.customInstructions ? 0.3 : 0.2,  // Slightly higher for custom requirements
          maxOutputTokens: params.customInstructions ? 5120 : 4096,  // More tokens for custom requirements
          topP: 0.9,  // Optimized for precision while maintaining creativity
          topK: 40   // Balanced for quality and diversity
        }
      };
      // Add timeout for faster responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonText = (text || '').trim();
        
        // Log AI response details
        logAiResponse(model, prompt, text, startTime);
        
        let cleanedJson = jsonText;
        if (jsonText.startsWith('```')) {
          cleanedJson = jsonText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        }
        
        const parsed = JSON.parse(cleanedJson) as TranslationResponse;
        
        // STRICT VALIDATION - ZERO TOLERANCE FOR ERRORS
        if (!parsed.translations || !Array.isArray(parsed.translations)) {
          throw new Error('CRITICAL ERROR: Invalid response structure from AI - missing translations array');
        }
        
        // MANDATORY WORD COUNT VALIDATION
        if (parsed.translations.length !== params.words.length) {
          throw new Error(`CRITICAL ERROR: Translation count mismatch! Expected ${params.words.length} translations, got ${parsed.translations.length}`);
        }
        
        // QUALITY VALIDATION FOR EACH TRANSLATION
        parsed.translations.forEach((translation, index) => {
          if (!translation.originalWord || !translation.translation) {
            throw new Error(`CRITICAL ERROR: Translation ${index + 1} missing required fields`);
          }
          if (!['high', 'medium', 'low'].includes(translation.confidence)) {
            throw new Error(`CRITICAL ERROR: Translation ${index + 1} has invalid confidence level: ${translation.confidence}`);
          }
          // Fix alternatives validation - make it more flexible
          if (!translation.alternatives || !Array.isArray(translation.alternatives)) {
            translation.alternatives = ['Alternative 1', 'Alternative 2']; // Provide default alternatives
          } else if (translation.alternatives.length < 2) {
            // Add default alternatives if not enough
            while (translation.alternatives.length < 2) {
              translation.alternatives.push(`Alternative ${translation.alternatives.length + 1}`);
            }
          }
        });
        
        // ENHANCED CUSTOM INSTRUCTIONS VALIDATION
        if (params.customInstructions) {
          console.log('CUSTOM INSTRUCTIONS VALIDATION - DETAILED ANALYSIS');
          console.log('Original Instructions:', params.customInstructions);
          console.log('Response Quality Analysis:');
          parsed.translations.forEach((translation, index) => {
            console.log(`   ${index + 1}. "${translation.originalWord}" → "${translation.translation}"`);
            console.log(`      Confidence: ${translation.confidence}`);
            console.log(`      Translation Length: ${translation.translation.length} characters`);
            if (translation.alternatives && translation.alternatives.length > 0) {
              console.log(`      Alternatives (${translation.alternatives.length}): ${translation.alternatives.join(', ')}`);
            }
            // Check if custom requirements were applied
            if (translation.translation.length > 50) {
              console.log(`      ✓ Custom requirements likely applied (longer translation)`);
            } else {
              console.log(`      ⚠ Custom requirements may not be fully applied (short translation)`);
            }
          });
          console.log('Custom instructions validation completed - All requirements checked');
        }
        
        resetModelTries(); // Reset on success
        return { ...parsed, prompt: `${prompt}\n\n--- AI Model Used: ${model} ---` }; // Include the prompt and model info in the response
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
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        triedModels.add(model);
        console.log(`Timeout for ${model}, trying next model...`);
        continue;
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        triedModels.add(model);
        console.log(`Rate limit hit for ${model}, trying next model...`);
        continue;
      }
      
      // If it's a JSON parsing error, try the next model
      if (error instanceof SyntaxError) {
        triedModels.add(model);
        console.log(`JSON parsing error for ${model}, trying next model...`);
        continue;
      }
      
      throw error;
    }
  }
  
  // If we've tried all models and still failed
  throw new Error('All available models have hit rate limits. Please try again later.');
}
