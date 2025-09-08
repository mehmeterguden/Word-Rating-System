// Test file for API key utility functions
import { 
  getApiKey, 
  getUserApiKey, 
  setUserApiKey, 
  getApiKeyStatus, 
  getApiKeyStatusText, 
  getApiKeyStatusColor 
} from '../apiKeys';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('API Key Utility', () => {
  describe('getApiKey', () => {
    it('should return user key when available', () => {
      localStorageMock.getItem.mockReturnValue('user-gemini-key');
      process.env.REACT_APP_GEMINI_API_KEY = 'env-gemini-key';
      
      const result = getApiKey('gemini');
      expect(result).toBe('user-gemini-key');
    });

    it('should return env key when user key is not available', () => {
      localStorageMock.getItem.mockReturnValue(null);
      process.env.REACT_APP_GEMINI_API_KEY = 'env-gemini-key';
      
      const result = getApiKey('gemini');
      expect(result).toBe('env-gemini-key');
    });

    it('should return null when no keys are available', () => {
      localStorageMock.getItem.mockReturnValue(null);
      process.env.REACT_APP_GEMINI_API_KEY = undefined;
      
      const result = getApiKey('gemini');
      expect(result).toBeNull();
    });
  });

  describe('getApiKeyStatus', () => {
    it('should correctly identify key status', () => {
      localStorageMock.getItem.mockReturnValue('user-key');
      process.env.REACT_APP_GEMINI_API_KEY = 'env-key';
      
      const status = getApiKeyStatus('gemini');
      expect(status).toEqual({
        hasUserKey: true,
        hasEnvKey: true,
        isConfigured: true
      });
    });

    it('should identify env-only status', () => {
      localStorageMock.getItem.mockReturnValue(null);
      process.env.REACT_APP_GEMINI_API_KEY = 'env-key';
      
      const status = getApiKeyStatus('gemini');
      expect(status).toEqual({
        hasUserKey: false,
        hasEnvKey: true,
        isConfigured: true
      });
    });

    it('should identify no-key status', () => {
      localStorageMock.getItem.mockReturnValue(null);
      process.env.REACT_APP_GEMINI_API_KEY = undefined;
      
      const status = getApiKeyStatus('gemini');
      expect(status).toEqual({
        hasUserKey: false,
        hasEnvKey: false,
        isConfigured: false
      });
    });
  });

  describe('getApiKeyStatusText', () => {
    it('should return correct text for user key', () => {
      const status = { hasUserKey: true, hasEnvKey: true, isConfigured: true };
      expect(getApiKeyStatusText(status)).toBe('User key configured');
    });

    it('should return correct text for env key', () => {
      const status = { hasUserKey: false, hasEnvKey: true, isConfigured: true };
      expect(getApiKeyStatusText(status)).toBe('Environment key available');
    });

    it('should return correct text for no key', () => {
      const status = { hasUserKey: false, hasEnvKey: false, isConfigured: false };
      expect(getApiKeyStatusText(status)).toBe('No key configured');
    });
  });

  describe('getApiKeyStatusColor', () => {
    it('should return correct color for user key', () => {
      const status = { hasUserKey: true, hasEnvKey: true, isConfigured: true };
      expect(getApiKeyStatusColor(status)).toBe('text-green-600 bg-green-100');
    });

    it('should return correct color for env key', () => {
      const status = { hasUserKey: false, hasEnvKey: true, isConfigured: true };
      expect(getApiKeyStatusColor(status)).toBe('text-blue-600 bg-blue-100');
    });

    it('should return correct color for no key', () => {
      const status = { hasUserKey: false, hasEnvKey: false, isConfigured: false };
      expect(getApiKeyStatusColor(status)).toBe('text-red-600 bg-red-100');
    });
  });

  describe('setUserApiKey', () => {
    it('should save key to localStorage', () => {
      setUserApiKey('gemini', 'test-key');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('word-rating-system-gemini-api-key', 'test-key');
    });

    it('should remove key when empty', () => {
      setUserApiKey('gemini', '');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('word-rating-system-gemini-api-key');
    });
  });
});
