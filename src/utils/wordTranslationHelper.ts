// Global word translation helper functions
// This allows any component to easily trigger word translation

interface WordTranslationOptions {
  word: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  onAddToWordList?: (word: string, translation: string) => void;
}

// Global state for word translation
let globalTranslationState: {
  isOpen: boolean;
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
  onAddToWordList?: (word: string, translation: string) => void;
} = {
  isOpen: false,
  word: '',
  sourceLanguage: 'English',
  targetLanguage: 'Turkish'
};

// Global listeners for state changes
const listeners: Array<(state: typeof globalTranslationState) => void> = [];

// Subscribe to state changes
export const subscribeToTranslationState = (callback: (state: typeof globalTranslationState) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners of state change
const notifyListeners = () => {
  listeners.forEach(callback => callback(globalTranslationState));
};

// Open word translation modal
export const openWordTranslation = (options: WordTranslationOptions) => {
  const {
    word,
    sourceLanguage = 'English',
    targetLanguage = 'Turkish',
    onAddToWordList
  } = options;

  globalTranslationState = {
    isOpen: true,
    word: word.trim(),
    sourceLanguage,
    targetLanguage,
    onAddToWordList
  };

  notifyListeners();
};

// Close word translation modal
export const closeWordTranslation = () => {
  globalTranslationState = {
    ...globalTranslationState,
    isOpen: false
  };

  notifyListeners();
};

// Get current translation state
export const getTranslationState = () => globalTranslationState;

// Helper function to detect and translate selected text
export const setupTextSelectionTranslation = (
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      
      // Only translate if it's a single word (no spaces)
      if (!selectedText.includes(' ') && selectedText.length > 0) {
        openWordTranslation({
          word: selectedText,
          sourceLanguage,
          targetLanguage,
          onAddToWordList
        });
      }
    }
  };

  // Add event listener for text selection
  document.addEventListener('mouseup', handleTextSelection);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('mouseup', handleTextSelection);
  };
};

// Helper function to add translation button to any element
export const addTranslationButton = (
  element: HTMLElement,
  word: string,
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  // Create translation button
  const button = document.createElement('button');
  button.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  `;
  button.className = 'inline-flex items-center justify-center p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors ml-2';
  button.title = `Translate "${word}"`;
  
  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openWordTranslation({
      word,
      sourceLanguage,
      targetLanguage,
      onAddToWordList
    });
  });

  // Add button to element
  element.appendChild(button);
  
  return button;
};

// Helper function to make any text clickable for translation
export const makeTextTranslatable = (
  element: HTMLElement,
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.textContent) {
      const word = target.textContent.trim();
      if (word && !word.includes(' ')) {
        openWordTranslation({
          word,
          sourceLanguage,
          targetLanguage,
          onAddToWordList
        });
      }
    }
  };

  element.addEventListener('click', handleClick);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('click', handleClick);
  };
};

export default {
  openWordTranslation,
  closeWordTranslation,
  getTranslationState,
  subscribeToTranslationState,
  setupTextSelectionTranslation,
  addTranslationButton,
  makeTextTranslatable
};
