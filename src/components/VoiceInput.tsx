import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTextChange: (text: string) => void;
  language?: string;
  disabled?: boolean;
  placeholder?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextChange,
  language = 'en-US',
  disabled = false,
  placeholder = 'Click to speak...'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const accumulatedTextRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const lastSentTextRef = useRef<string>('');
  const textUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentenceEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out filler words and thinking sounds
  const filterFillerWords = (text: string): string => {
    const fillerWords = [
      'um', 'uh', 'er', 'ah', 'eh', 'oh', 'hmm', 'hm', 'mmm',
      'ııı', 'ıı', 'ı', 'eee', 'ee', 'e', 'aaa', 'aa', 'a',
      'şey', 'yani', 'hani', 'işte', 'falan', 'filan',
      'like', 'you know', 'well', 'so', 'actually', 'basically'
    ];
    
    let filteredText = text.toLowerCase().trim();
    
    // Remove filler words
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    
    // Clean up extra spaces
    filteredText = filteredText.replace(/\s+/g, ' ').trim();
    
    return filteredText;
  };

  // Check if sentence is complete
  const isSentenceComplete = (text: string): boolean => {
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    
    // Check for sentence ending patterns
    const sentenceEndings = [
      /[.!?]$/,  // Period, exclamation, question mark
      /\.$/,     // Just period
      /!$/,      // Just exclamation
      /\\?$/,    // Just question mark
      /\.\s*$/,  // Period with optional spaces
      /!\s*$/,   // Exclamation with optional spaces
      /\\?\s*$/  // Question mark with optional spaces
    ];
    
    // Check if text ends with sentence ending
    const hasEnding = sentenceEndings.some(pattern => pattern.test(trimmedText));
    
    // Also check for common sentence completion words
    const completionWords = [
      'thanks', 'thank you', 'okay', 'ok', 'done', 'finished', 'complete',
      'teşekkürler', 'tamam', 'bitti', 'tamamlandı', 'son', 'bitirdim'
    ];
    
    const endsWithCompletion = completionWords.some(word => 
      trimmedText.toLowerCase().endsWith(word.toLowerCase())
    );
    
    // Check if it's a reasonable sentence length (at least 3 words)
    const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
    const isReasonableLength = wordCount >= 3;
    
    return (hasEnding || endsWithCompletion) && isReasonableLength;
  };

  // Auto-stop when sentence is complete
  const checkForSentenceCompletion = (text: string) => {
    if (isSentenceComplete(text)) {
      console.log('Sentence appears complete, scheduling auto-stop:', text);
      
      // Clear any existing timeout
      if (sentenceEndTimeoutRef.current) {
        clearTimeout(sentenceEndTimeoutRef.current);
      }
      
      // Wait a bit to see if more text comes, then stop
      sentenceEndTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          console.log('Auto-stopping due to sentence completion');
          setIsListening(false);
          recognitionRef.current.stop();
        }
      }, 1500); // Wait 1.5 seconds for potential additional text
    }
  };

  // Audio level monitoring
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = average / 255;
          setAudioLevel(normalizedLevel);
          
          // Detect if user is speaking (threshold can be adjusted)
          const speakingThreshold = 0.01;
          const wasSpeaking = isSpeaking;
          const nowSpeaking = normalizedLevel > speakingThreshold;
          
          if (nowSpeaking !== wasSpeaking) {
            setIsSpeaking(nowSpeaking);
            if (nowSpeaking) {
              lastSpeechTimeRef.current = Date.now();
              // Clear silence timeout when user starts speaking
              if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
              }
            }
          }
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (err) {
      console.warn('Audio monitoring not available:', err);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.warn('AudioContext already closed:', err);
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
    setIsSpeaking(false);
  };

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Enhanced configuration for better recognition
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Get interim results
      recognitionRef.current.lang = language;
      recognitionRef.current.maxAlternatives = 1;

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        setIsSpeaking(false);
        lastSpeechTimeRef.current = Date.now();
        accumulatedTextRef.current = '';
        setInterimText('');
        
        // Set initial timeout - wait 15 seconds for first speech
        silenceTimeoutRef.current = setTimeout(() => {
          if (isListening) {
            const timeSinceStart = Date.now() - lastSpeechTimeRef.current;
            console.log('Initial timeout check:', timeSinceStart, 'ms since start');
            // Wait 15 seconds for first speech, then 8 seconds between speeches
            if (timeSinceStart > 15000) {
              console.log('Stopping due to 15 second initial timeout');
              setIsListening(false);
              recognitionRef.current.stop();
            }
          }
        }, 15000);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            lastSpeechTimeRef.current = Date.now();
          } else {
            interimTranscript += transcript;
            lastSpeechTimeRef.current = Date.now();
          }
        }

        // Update interim text for real-time visual feedback only
        if (interimTranscript.trim()) {
          setInterimText(interimTranscript);
        } else {
          setInterimText('');
        }

        // Only process final transcripts - don't send interim results to parent
        if (finalTranscript.trim()) {
          const filteredText = filterFillerWords(finalTranscript);
          if (filteredText) {
            // Add to accumulated text
            accumulatedTextRef.current += (accumulatedTextRef.current ? ' ' : '') + filteredText;
            
            // Debounced text update - wait a bit to see if more text comes
            if (textUpdateTimeoutRef.current) {
              clearTimeout(textUpdateTimeoutRef.current);
            }
            
            textUpdateTimeoutRef.current = setTimeout(() => {
              // Only send if text has changed
              if (accumulatedTextRef.current !== lastSentTextRef.current) {
                console.log('Sending final text to parent:', accumulatedTextRef.current);
                lastSentTextRef.current = accumulatedTextRef.current;
                onTextChange(accumulatedTextRef.current);
                
                // Check if sentence is complete and schedule auto-stop
                checkForSentenceCompletion(accumulatedTextRef.current);
              }
            }, 500); // Wait 500ms for more text to accumulate
          }
        }

        // Reset silence timeout whenever we get speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Set timeout for auto-stop (much longer for better user experience)
        silenceTimeoutRef.current = setTimeout(() => {
          if (isListening) {
            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
            console.log('Silence timeout check:', timeSinceLastSpeech, 'ms since last speech');
            // Only stop if no speech for 8 seconds - much more patient
            if (timeSinceLastSpeech > 8000) {
              console.log('Stopping due to 8 second silence');
              setIsListening(false);
              recognitionRef.current.stop();
            }
          }
        }, 8000);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found or blocked.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
        setIsSpeaking(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsSpeaking(false);
        setInterimText('');
        
        // Don't send text again on end - already sent during onresult
        // Just log what we have accumulated
        console.log('Final accumulated text:', accumulatedTextRef.current);
        
        // Check if we should restart listening (if user wants to continue)
        if (isListening) {
          console.log('Restarting speech recognition...');
          // Small delay before restart to avoid conflicts
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.log('Restart failed, stopping:', err);
                setIsListening(false);
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current.onspeechstart = () => {
        setIsSpeaking(true);
        lastSpeechTimeRef.current = Date.now();
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      recognitionRef.current.onspeechend = () => {
        setIsSpeaking(false);
        // Don't stop immediately - wait for silence timeout
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (textUpdateTimeoutRef.current) {
        clearTimeout(textUpdateTimeoutRef.current);
      }
      if (sentenceEndTimeoutRef.current) {
        clearTimeout(sentenceEndTimeoutRef.current);
      }
      stopAudioMonitoring();
    };
  }, [language, onTextChange]);

  const startListening = async () => {
    if (!isSupported || disabled) return;
    
    // If already listening, stop it
    if (isListening) {
      stopListening();
      return;
    }
    
    try {
      setError(null);
      accumulatedTextRef.current = '';
      lastSentTextRef.current = '';
      setInterimText('');
      setIsListening(true);
      recognitionRef.current.start();
      await startAudioMonitoring();
      
      // Start aggressive restart mechanism
      startAggressiveRestart();
      
    } catch (err) {
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  // Aggressive restart mechanism to bypass Speech Recognition API timeout
  const startAggressiveRestart = () => {
    const restartInterval = setInterval(() => {
      if (!isListening) {
        clearInterval(restartInterval);
        return;
      }
      
      // Check if recognition is still active
      if (recognitionRef.current && recognitionRef.current.state === 'idle') {
        console.log('Speech recognition went idle, restarting...');
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.log('Restart failed:', err);
        }
      }
    }, 2000); // Check every 2 seconds
    
    // Store interval reference for cleanup
    (recognitionRef.current as any).restartInterval = restartInterval;
  };

  const stopListening = () => {
    setIsListening(false);
    
    if (recognitionRef.current) {
      // Clear restart interval
      if ((recognitionRef.current as any).restartInterval) {
        clearInterval((recognitionRef.current as any).restartInterval);
      }
      
      if (isListening) {
        recognitionRef.current.stop();
      }
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (textUpdateTimeoutRef.current) {
      clearTimeout(textUpdateTimeoutRef.current);
    }
    if (sentenceEndTimeoutRef.current) {
      clearTimeout(sentenceEndTimeoutRef.current);
    }
    stopAudioMonitoring();
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <span className="text-gray-500 text-sm">Speech recognition not supported</span>
      </div>
    );
  }

  return (
    <button
      onClick={startListening}
      disabled={disabled}
      className={`relative p-2 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 overflow-hidden ${
        isListening
          ? isSpeaking
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl ring-2 ring-orange-200'
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg ring-2 ring-red-200'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={
        isListening 
          ? isSpeaking 
            ? 'Listening... (speaking detected) - Click to stop' 
            : 'Listening... (waiting for speech) - Click to stop'
          : 'Start voice input - Speak your word'
      }
    >
        {/* Microphone Icon */}
        <div className="relative flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isListening ? (
              // Animated microphone with sound waves
              <g>
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                />
                {/* Beautiful sound waves */}
                <g className="opacity-70">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M15 6l3 3m0 0l3-3m-3 3v6m-3-6l-3 3m0 0l-3-3m3 3v6"
                    style={{
                      transform: `scale(${0.6 + audioLevel * 0.8})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.15s ease-out'
                    }}
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M12 4l2 2m0 0l2-2m-2 2v8m-2-8l-2 2m0 0l-2-2m2 2v8"
                    style={{
                      transform: `scale(${0.4 + audioLevel * 0.6})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.15s ease-out'
                    }}
                  />
                </g>
              </g>
            ) : (
              // Beautiful static microphone icon
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            )}
          </svg>
        </div>

        {/* Beautiful audio level indicator */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className={`w-full h-full transition-all duration-150 ${
                isSpeaking 
                  ? 'bg-gradient-to-r from-orange-400/25 to-red-400/25' 
                  : 'bg-gradient-to-r from-red-400/15 to-pink-400/15'
              }`}
              style={{
                transform: `scaleY(${0.2 + audioLevel * 0.8})`,
                transformOrigin: 'center bottom',
                borderRadius: '50%'
              }}
            />
          </div>
        )}

        {/* Beautiful pulsing ring effect */}
        {isListening && (
          <div className={`absolute inset-0 transition-all duration-300 ${
            isSpeaking 
              ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 animate-pulse' 
              : 'bg-gradient-to-r from-red-500/15 to-pink-500/15 animate-ping'
          }`} style={{ borderRadius: '50%' }}></div>
        )}
      </button>
  );
};

export default VoiceInput;
