// API Key Management Utility
// Handles API keys with priority: user input > .env variables
// Never exposes .env keys to the user interface

export interface ApiKeyStatus {
  hasUserKey: boolean;
  hasEnvKey: boolean;
  isConfigured: boolean;
}

export interface ApiKeyConfig {
  gemini: string | null;
  unsplash: string | null;
  pixabay: string | null;
}

// LocalStorage keys for user-provided API keys
const GEMINI_KEY = 'word-rating-system-gemini-api-key';
const UNSPLASH_KEY = 'word-rating-system-unsplash-api-key';
const PIXABAY_KEY = 'word-rating-system-pixabay-api-key';

// Get API key with priority: user input > .env
export const getApiKey = (keyType: 'gemini' | 'unsplash' | 'pixabay'): string | null => {
  // First check user-provided key
  const userKey = getUserApiKey(keyType);
  if (userKey && userKey.trim()) {
    return userKey.trim();
  }
  
  // Fallback to .env key
  const envKey = getEnvApiKey(keyType);
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  
  return null;
};

// Get user-provided API key from localStorage
export const getUserApiKey = (keyType: 'gemini' | 'unsplash' | 'pixabay'): string | null => {
  try {
    const key = keyType === 'gemini' ? GEMINI_KEY : 
                keyType === 'unsplash' ? UNSPLASH_KEY : PIXABAY_KEY;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// Get .env API key (for internal use only)
const getEnvApiKey = (keyType: 'gemini' | 'unsplash' | 'pixabay'): string | null => {
  switch (keyType) {
    case 'gemini':
      return process.env.REACT_APP_GEMINI_API_KEY || null;
    case 'unsplash':
      return process.env.REACT_APP_UNSPLASH_ACCESS_KEY || null;
    case 'pixabay':
      return process.env.REACT_APP_PIXABAY_ACCESS_KEY || null;
    default:
      return null;
  }
};

// Set user-provided API key
export const setUserApiKey = (keyType: 'gemini' | 'unsplash' | 'pixabay', key: string): void => {
  try {
    const storageKey = keyType === 'gemini' ? GEMINI_KEY : 
                      keyType === 'unsplash' ? UNSPLASH_KEY : PIXABAY_KEY;
    if (key && key.trim()) {
      localStorage.setItem(storageKey, key.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.error('Failed to save API key:', error);
  }
};

// Get API key status for UI display
export const getApiKeyStatus = (keyType: 'gemini' | 'unsplash' | 'pixabay'): ApiKeyStatus => {
  const hasUserKey = !!getUserApiKey(keyType);
  const hasEnvKey = !!getEnvApiKey(keyType);
  
  return {
    hasUserKey,
    hasEnvKey,
    isConfigured: hasUserKey || hasEnvKey
  };
};

// Get all API key statuses
export const getAllApiKeyStatuses = (): Record<string, ApiKeyStatus> => {
  return {
    gemini: getApiKeyStatus('gemini'),
    unsplash: getApiKeyStatus('unsplash'),
    pixabay: getApiKeyStatus('pixabay')
  };
};

// Clear all user-provided API keys
export const clearAllUserApiKeys = (): void => {
  try {
    localStorage.removeItem(GEMINI_KEY);
    localStorage.removeItem(UNSPLASH_KEY);
    localStorage.removeItem(PIXABAY_KEY);
  } catch (error) {
    console.error('Failed to clear API keys:', error);
  }
};

// Test API key functionality
export const testApiKey = async (keyType: 'gemini' | 'unsplash' | 'pixabay', key: string): Promise<boolean> => {
  const trimmedKey = key.trim();
  if (!trimmedKey) return false;
  
  try {
    switch (keyType) {
      case 'gemini':
        return await testGeminiKey(trimmedKey);
      case 'unsplash':
        return await testUnsplashKey(trimmedKey);
      case 'pixabay':
        return await testPixabayKey(trimmedKey);
      default:
        return false;
    }
  } catch {
    return false;
  }
};

// Test Gemini API key
const testGeminiKey = async (key: string): Promise<boolean> => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Test' }] }]
      })
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Test Unsplash API key
const testUnsplashKey = async (key: string): Promise<boolean> => {
  try {
    const url = `https://api.unsplash.com/search/photos?query=test&per_page=1&client_id=${key}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

// Test Pixabay API key
const testPixabayKey = async (key: string): Promise<boolean> => {
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=test&per_page=1`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

// Get display text for API key status
export const getApiKeyStatusText = (status: ApiKeyStatus): string => {
  if (status.hasUserKey) {
    return 'User key configured';
  } else if (status.hasEnvKey) {
    return 'Environment key available';
  } else {
    return 'No key configured';
  }
};

// Get status color for UI
export const getApiKeyStatusColor = (status: ApiKeyStatus): string => {
  if (status.hasUserKey) {
    return 'text-green-600 bg-green-100';
  } else if (status.hasEnvKey) {
    return 'text-blue-600 bg-blue-100';
  } else {
    return 'text-red-600 bg-red-100';
  }
};
