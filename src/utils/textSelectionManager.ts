// Global text selection manager for word translation
// This handles text selection across the entire website

interface SelectionState {
  selectedWord: string;
  position: { x: number; y: number };
  isVisible: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  onAddToWordList?: (word: string, translation: string) => void;
}

// Global state
let globalSelectionState: SelectionState = {
  selectedWord: '',
  position: { x: 0, y: 0 },
  isVisible: false,
  sourceLanguage: 'English',
  targetLanguage: 'Turkish'
};

// Global listeners
const listeners: Array<(state: SelectionState) => void> = [];

// Global timeout for delayed container opening
let globalSelectionTimeout: NodeJS.Timeout | null = null;

// Track current selection to prevent unnecessary container closing
let currentSelectedText: string = '';

// Subscribe to selection state changes
export const subscribeToSelectionState = (callback: (state: SelectionState) => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners
const notifyListeners = () => {
  listeners.forEach(callback => callback(globalSelectionState));
};

// Show word selection container
export const showWordSelection = (
  word: string,
  position: { x: number; y: number },
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  console.log('🚀 Showing word selection container immediately for:', word.trim());
  
  globalSelectionState = {
    selectedWord: word.trim(),
    position,
    isVisible: true,
    sourceLanguage,
    targetLanguage,
    onAddToWordList
  };

  notifyListeners();
};

// Hide word selection container
export const hideWordSelection = () => {
  globalSelectionState = {
    ...globalSelectionState,
    isVisible: false
  };

  // Clear current selection when hiding
  currentSelectedText = '';
  
  // Clear any pending timeout
  if (globalSelectionTimeout) {
    clearTimeout(globalSelectionTimeout);
    globalSelectionTimeout = null;
  }

  notifyListeners();
};

// Get current selection state
export const getSelectionState = () => globalSelectionState;

// Check if text is valid for translation (can be word or phrase)
const isValidText = (text: string): boolean => {
  const trimmedText = text.trim();
  
  console.log('🔍 Validating text:', trimmedText);
  
  // Must not be empty
  if (!trimmedText) {
    console.log('❌ Empty text');
    return false;
  }
  
  // Must be reasonable length (1-200 characters for phrases)
  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log('❌ Invalid length:', trimmedText.length);
    return false;
  }
  
  // Must not be just numbers
  if (/^\d+$/.test(trimmedText)) {
    console.log('❌ Just numbers');
    return false;
  }
  
  // Must not be just punctuation
  if (/^[^a-zA-ZçğıöşüÇĞIİÖŞÜ0-9]+$/.test(trimmedText)) {
    console.log('❌ Just punctuation');
    return false;
  }
  
  // Must contain at least some letters (not just special characters)
  if (!/[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(trimmedText)) {
    console.log('❌ No letters found');
    return false;
  }
  
  // Check word count (max 10 words for phrases)
  const wordCount = trimmedText.split(/\s+/).length;
  if (wordCount > 10) {
    console.log('❌ Too many words:', wordCount);
    return false;
  }
  
  console.log('✅ Valid text (word count:', wordCount, ')');
  return true;
};

// Get selection position
const getSelectionPosition = (): { x: number; y: number } => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { x: 0, y: 0 };
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position the container near the selection
  const containerWidth = 400; // Approximate container width
  const containerHeight = 300; // Approximate container height
  const padding = 20;
  
  let x = rect.left + (rect.width / 2) - (containerWidth / 2); // Center horizontally
  let y = rect.bottom + 10; // Below the selection
  
  // Adjust horizontal position if container would go off-screen
  if (x + containerWidth > window.innerWidth - padding) {
    x = window.innerWidth - containerWidth - padding;
  }
  if (x < padding) {
    x = padding;
  }

  // Adjust vertical position if container would go off-screen
  if (y + containerHeight > window.innerHeight - padding) {
    y = rect.top - containerHeight - 10; // Show above selection
  }
  if (y < padding) {
    y = padding;
  }
  
  return { x, y };
};

// Handle text selection
const handleTextSelection = (
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  console.log('🎯 Text selection handler triggered');
  
  // Add a small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) {
      console.log('🔍 No text selection found');
      // Clear current selection and hide container if visible
      if (currentSelectedText) {
        currentSelectedText = '';
        if (globalSelectionState.isVisible) {
          console.log('🔍 Selection cleared, hiding container');
          hideWordSelection();
        }
      }
      return;
    }

    const selectedText = selection.toString().trim();
    console.log('🔍 Text selected:', `"${selectedText}"`);
    
    // If it's the same selection, don't do anything
    if (selectedText === currentSelectedText) {
      console.log('🔄 Same selection, ignoring event');
      return;
    }
    
    // Clear any existing timeout
    if (globalSelectionTimeout) {
      clearTimeout(globalSelectionTimeout);
      globalSelectionTimeout = null;
    }
    
    // Hide container only if it's a different selection
    if (globalSelectionState.isVisible && currentSelectedText) {
      console.log('🔄 Different selection detected, hiding container');
      hideWordSelection();
    }
    
    // Update current selection
    currentSelectedText = selectedText;
    
    // Only show container for valid text (word or phrase)
    if (isValidText(selectedText)) {
      const position = getSelectionPosition();
      console.log('✅ Valid text selected, scheduling container opening in 1 second');
      
      // Set timeout to show container after 1 second
      globalSelectionTimeout = setTimeout(() => {
        // Double-check that selection is still the same
        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.toString().trim() === selectedText) {
          console.log('🚀 1 second passed, showing container for:', selectedText);
          showWordSelection(selectedText, position, sourceLanguage, targetLanguage, onAddToWordList);
        } else {
          console.log('🔄 Selection changed during 1-second wait, not showing container');
        }
        globalSelectionTimeout = null;
      }, 700); // Wait 1 second before showing container
    } else {
      console.log('❌ Invalid text selection:', `"${selectedText}"`);
      currentSelectedText = ''; // Reset if invalid
    }
  }, 50); // Small delay to ensure selection is complete
};

// Setup global text selection listener
export const setupGlobalTextSelection = (
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  console.log('🔧 Setting up text selection listeners...');
  
  // Create new handler with current settings
  const selectionHandler = () => {
    console.log('🎯 Selection event triggered');
    handleTextSelection(sourceLanguage, targetLanguage, onAddToWordList);
  };
  
  // Add event listeners for text selection
  document.addEventListener('mouseup', selectionHandler);
  document.addEventListener('keyup', selectionHandler);
  
  // Add selectionchange event listener (most important for text selection)
  document.addEventListener('selectionchange', selectionHandler);
  
  console.log('✅ Event listeners added: mouseup, keyup, selectionchange');
  
  // Return cleanup function
  return () => {
    console.log('🧹 Removing text selection listeners');
    document.removeEventListener('mouseup', selectionHandler);
    document.removeEventListener('keyup', selectionHandler);
    document.removeEventListener('selectionchange', selectionHandler);
  };
};

// Handle clicks outside the container to close it
export const setupClickOutsideHandler = () => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Check if click is outside the word selection container
    if (globalSelectionState.isVisible && 
        !target.closest('[data-word-selection-container]') &&
        !target.closest('[data-word-selection-trigger]')) {
      hideWordSelection();
    }
  };

  document.addEventListener('click', handleClickOutside);
  
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
};

// Handle escape key to close container
export const setupEscapeKeyHandler = () => {
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && globalSelectionState.isVisible) {
      hideWordSelection();
    }
  };

  document.addEventListener('keydown', handleEscapeKey);
  
  return () => {
    document.removeEventListener('keydown', handleEscapeKey);
  };
};

// Initialize all handlers
export const initializeTextSelection = (
  sourceLanguage: string = 'English',
  targetLanguage: string = 'Turkish',
  onAddToWordList?: (word: string, translation: string) => void
) => {
  const cleanupSelection = setupGlobalTextSelection(sourceLanguage, targetLanguage, onAddToWordList);
  const cleanupClickOutside = setupClickOutsideHandler();
  const cleanupEscapeKey = setupEscapeKeyHandler();
  
  return () => {
    cleanupSelection();
    cleanupClickOutside();
    cleanupEscapeKey();
  };
};

export default {
  showWordSelection,
  hideWordSelection,
  getSelectionState,
  subscribeToSelectionState,
  setupGlobalTextSelection,
  setupClickOutsideHandler,
  setupEscapeKeyHandler,
  initializeTextSelection
};
