import React, { useState, useRef, useEffect } from 'react';
import { generateWordTranslations } from '../utils/wordTranslation';
import VoiceInput from './VoiceInput';

interface TranslationSuggestion {
  originalWord: string;
  translation: string;
  alternatives: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface LiveTranslationProps {
  language1: string;
  language2: string;
  separator: string;
  onWordAdded: (wordPair: { text1: string; text2: string; language1Name: string; language2Name: string }) => void;
  onAddToTextarea: (text: string) => void;
  disabled?: boolean;
}

const LiveTranslation: React.FC<LiveTranslationProps> = ({
  language1,
  language2,
  separator,
  onWordAdded,
  onAddToTextarea,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState<TranslationSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear suggestion if user is typing
    if (currentSuggestion) {
      setCurrentSuggestion(null);
    }
  };

  // Handle Enter key press
  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading && !disabled) {
      e.preventDefault();
      
      // If we have a current suggestion, accept the main translation
      if (currentSuggestion) {
        acceptMainTranslation();
      } else {
        // Extract text before separator (if exists) or use full input
        const textToTranslate = inputValue.includes(separator) 
          ? inputValue.split(separator)[0].trim()
          : inputValue.trim();
        
        if (textToTranslate) {
          await generateTranslation(textToTranslate);
        }
      }
    }
  };

  // Generate translation for the word
  const generateTranslation = async (word: string) => {
    if (!word || isLoading) return;

    setIsLoading(true);
    setCurrentSuggestion(null);

    try {
      const result = await generateWordTranslations({
        words: [word],
        sourceLanguageName: language1,
        targetLanguageName: language2,
        separator: ' - ',
        customInstructions: ''
      });

      if (result.translations && result.translations.length > 0) {
        const translation = result.translations[0];
        const suggestion = {
          originalWord: word,
          translation: translation.translation,
          alternatives: translation.alternatives || [],
          confidence: translation.confidence || 'medium'
        };
        setCurrentSuggestion(suggestion);
        setSelectedTranslation(translation.translation);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept main translation (Enter key)
  const acceptMainTranslation = () => {
    if (currentSuggestion) {
      const textToAdd = `${currentSuggestion.originalWord} - ${selectedTranslation}`;
      onAddToTextarea(textToAdd);
      
      // Clear input and suggestion
      setInputValue('');
      setCurrentSuggestion(null);
      setSelectedTranslation('');
      
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Save edited translation
  const saveTranslation = () => {
    if (currentSuggestion) {
      const textToAdd = `${currentSuggestion.originalWord} - ${selectedTranslation}`;
      onAddToTextarea(textToAdd);
      
      // Clear input and suggestion
      setInputValue('');
      setCurrentSuggestion(null);
      setSelectedTranslation('');
      
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle alternative selection
  const handleAlternativeSelect = (alternative: string) => {
    if (currentSuggestion) {
      // Swap the selected alternative with the main translation
      const newMainTranslation = alternative;
      const newAlternatives = currentSuggestion.alternatives.map(alt => 
        alt === alternative ? currentSuggestion.translation : alt
      );
      
      // Update the suggestion
      setCurrentSuggestion({
        ...currentSuggestion,
        translation: newMainTranslation,
        alternatives: newAlternatives
      });
      
      // Update selected translation
      setSelectedTranslation(newMainTranslation);
    }
  };



  // Reject suggestion
  const rejectSuggestion = () => {
    setCurrentSuggestion(null);
    setSelectedTranslation('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle click outside to close suggestion
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setCurrentSuggestion(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle voice input
  const handleVoiceInput = (text: string) => {
    setInputValue(text);
    // Don't auto-translate - let user decide when to translate
    // User can press Enter or click Send button to translate
  };

  // Get language code for voice input
  const getLanguageCode = (languageName: string): string => {
    const languageMap: { [key: string]: string } = {
      'English': 'en-US',
      'Turkish': 'tr-TR',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT',
      'Russian': 'ru-RU',
      'Chinese': 'zh-CN',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Arabic': 'ar-SA',
      'Hindi': 'hi-IN',
      'Dutch': 'nl-NL',
      'Swedish': 'sv-SE',
      'Norwegian': 'no-NO',
      'Danish': 'da-DK',
      'Finnish': 'fi-FI',
      'Polish': 'pl-PL',
      'Czech': 'cs-CZ',
      'Hungarian': 'hu-HU',
      'Greek': 'el-GR',
      'Hebrew': 'he-IL',
      'Thai': 'th-TH',
      'Vietnamese': 'vi-VN',
      'Indonesian': 'id-ID',
      'Malay': 'ms-MY',
      'Filipino': 'fil-PH'
    };
    
    return languageMap[languageName] || 'en-US';
  };

  // Text-to-speech function with saved voice preference
  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = getLanguageCode(language);
      utterance.lang = langCode;
      
      // Get saved voice preference from cookies/localStorage
      const voiceKey = `tts-voice-${langCode}`;
      let preferredVoiceName: string | null = null;
      try {
        preferredVoiceName = localStorage.getItem(voiceKey);
      } catch (err) {
        console.warn('Could not access localStorage for voice preference');
      }
      
      // Set voice based on saved preference or fallback
      const voices = window.speechSynthesis.getVoices();
      let targetVoice: SpeechSynthesisVoice | undefined;
      
      if (preferredVoiceName) {
        // Use saved voice preference
        targetVoice = voices.find(voice => voice.name === preferredVoiceName);
      }
      
      if (!targetVoice) {
        // Fallback: find default voice for language
        targetVoice = voices.find(voice => 
          voice.lang === langCode && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith(langCode.split('-')[0])
        );
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
      
      // Set speech parameters
      utterance.rate = 0.9; // Slightly slower for better understanding
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  return (
    <div className="relative">

      {/* Input field */}
      <div className="relative flex">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={`Type a word in ${language1} for translation...`}
          disabled={disabled}
          className={`flex-1 px-4 py-3 pr-20 border-2 rounded-l-xl text-gray-900 placeholder-gray-500 transition-all duration-200 ${
            disabled 
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
              : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          } ${currentSuggestion ? 'border-blue-400' : ''}`}
        />
        
        {/* Voice Input Button */}
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 z-10">
          <VoiceInput
            onTextChange={handleVoiceInput}
            language={getLanguageCode(language1)}
            disabled={disabled}
          />
        </div>
        
        {/* Send button */}
        <button
          onClick={async () => {
            if (inputValue.trim() && !isLoading && !disabled) {
              if (currentSuggestion) {
                acceptMainTranslation();
              } else {
                const textToTranslate = inputValue.includes(separator) 
                  ? inputValue.split(separator)[0].trim()
                  : inputValue.trim();
                
                if (textToTranslate) {
                  await generateTranslation(textToTranslate);
                }
              }
            }
          }}
          disabled={!inputValue.trim() || isLoading || disabled}
          className={`px-4 py-3 border-2 border-l-0 rounded-r-xl transition-all duration-200 ${
            !inputValue.trim() || isLoading || disabled
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
          }`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Translation suggestion popup */}
      {currentSuggestion && (
        <div
          ref={suggestionRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-6 min-w-80 max-w-96"
          style={{
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{currentSuggestion.originalWord}</span>
              
              {/* Voice button for original word */}
              <button
                onClick={() => speakText(currentSuggestion.originalWord, language1)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                title={`Listen to "${currentSuggestion.originalWord}" in ${language1}`}
              >
                <svg 
                  className="w-4 h-4 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
                  />
                </svg>
              </button>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentSuggestion.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
                currentSuggestion.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {currentSuggestion.confidence === 'high' ? '🟢 High' : 
                 currentSuggestion.confidence === 'medium' ? '🟡 Medium' : '🔴 Low'}
              </span>
            </div>
            <button
              onClick={rejectSuggestion}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main translation selection */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Main Translation:</div>
            <input
              type="text"
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Edit translation..."
            />
          </div>

          {/* Alternatives */}
          {currentSuggestion.alternatives.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Alternatives:</div>
              <div className="flex flex-wrap gap-2">
                {currentSuggestion.alternatives.slice(0, 3).map((alternative, index) => {
                  const isSelected = selectedTranslation === alternative;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAlternativeSelect(alternative)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {alternative}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={saveTranslation}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>Save</span>
            </button>
            <button
              onClick={rejectSuggestion}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTranslation;
