# API Key Management System

This application now includes a comprehensive API key management system that allows users to configure their API keys through the Settings page, with automatic fallback to environment variables.

## Features

### 🔐 **Priority System**
- **User-provided keys** take precedence over environment variables
- **Environment variables** are used as fallback when user keys are not available
- **No key exposure** - .env keys are never displayed to users

### 🎯 **Supported APIs**
- **Gemini AI** - For AI translations and evaluations
- **Unsplash** - For high-quality word images (50 requests/day)
- **Pixabay** - For diverse word images (5000 requests/day)

### ✅ **Key Features**
- **Real-time validation** - Test API keys before saving
- **Status indicators** - Visual feedback on key availability
- **Secure storage** - Keys stored in localStorage with proper validation
- **User-friendly interface** - Easy-to-use Settings page

## How to Use

### 1. Access Settings
Navigate to the Settings page in the application to configure your API keys.

### 2. Configure API Keys
For each API service:
1. **Enter your API key** in the password field
2. **Test the key** using the "Test" button to verify it works
3. **Save the key** using the "Save" button to store it
4. **Clear the key** using the "Clear" button to remove it

### 3. Status Indicators
- 🟢 **User key configured** - You have provided a key
- 🔵 **Environment key available** - Using .env fallback
- 🔴 **No key configured** - No key available

## Getting API Keys

### Gemini AI Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### Unsplash Key
1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Sign up for a developer account
3. Create a new application
4. Copy the Access Key from your application

### Pixabay Key
1. Visit [Pixabay API](https://pixabay.com/api/docs/)
2. Sign up for a free account
3. Go to your account settings
4. Copy the API key

## Technical Implementation

### API Key Utility (`src/utils/apiKeys.ts`)
```typescript
// Get API key with priority: user input > .env
const apiKey = getApiKey('gemini');

// Check key status
const status = getApiKeyStatus('gemini');
// Returns: { hasUserKey: boolean, hasEnvKey: boolean, isConfigured: boolean }

// Test API key
const isValid = await testApiKey('gemini', 'your-key-here');
```

### Integration Points
- **AI Services** (`src/utils/ai.ts`) - Uses `getApiKey('gemini')`
- **Image Services** (`src/utils/imageApi.ts`) - Uses `getApiKey('unsplash')` and `getApiKey('pixabay')`
- **Translation Services** (`src/utils/wordTranslation.ts`) - Uses `getApiKey('gemini')`

### Environment Variables (Fallback)
```bash
# .env file (optional - used as fallback)
REACT_APP_GEMINI_API_KEY=your_gemini_key_here
REACT_APP_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
REACT_APP_PIXABAY_ACCESS_KEY=your_pixabay_key_here
```

## Security Features

### 🔒 **Key Protection**
- Keys are stored as password fields (hidden input)
- No .env keys are ever displayed in the UI
- Keys are only stored in localStorage (client-side)
- Proper validation and error handling

### 🛡️ **Error Handling**
- Graceful fallback to environment variables
- Clear error messages when keys are missing
- Validation before API calls
- Test functionality to verify keys work

## Migration from Environment Variables

If you previously used environment variables:

1. **No changes required** - Your .env keys will continue to work as fallback
2. **Optional upgrade** - You can now configure keys through the UI for easier management
3. **Priority system** - User-configured keys will override .env keys

## Troubleshooting

### Common Issues

**"Missing API key" error:**
- Check if you have configured the key in Settings
- Verify the key is valid using the "Test" button
- Ensure the key is saved after entering it

**"API key is invalid" error:**
- Double-check the key was copied correctly
- Ensure there are no extra spaces or characters
- Verify the key is still active on the service provider

**Environment key not working:**
- Check your .env file is in the project root
- Ensure variable names match exactly: `REACT_APP_GEMINI_API_KEY`, etc.
- Restart the development server after adding .env variables

### Support

For technical issues or questions about the API key system, please refer to the application's debug tools (available in Developer Mode) or check the browser console for detailed error messages.
