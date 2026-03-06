// Image API utility for word images - Unsplash + Pixabay hybrid
import { getApiKey } from './apiKeys';

interface UnsplashImage {
    id: string;
    urls: {
        small: string;
        regular: string;
        full: string;
    };
    alt_description: string;
    user: {
        name: string;
    };
}

interface UnsplashResponse {
    results: UnsplashImage[];
    total: number;
}

interface PixabayImage {
    id: number;
    webformatURL: string;
    largeImageURL: string;
    user: string;
    tags: string;
}

interface PixabayResponse {
    hits: PixabayImage[];
    total: number;
}

// API limit tracking
interface ApiLimits {
    unsplash: {
        remaining: number;
        resetTime: number;
    };
    pixabay: {
        remaining: number;
        resetTime: number;
    };
}

// Cache için localStorage key'leri
const IMAGE_CACHE_KEY = 'word-image-cache';
const API_LIMITS_KEY = 'api-limits-cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 gün

// Yeni cache veri yapısı
interface ImageCacheData {
    [word: string]: {
        url: string;
        source: 'unsplash' | 'pixabay' | 'cache';
        timestamp: number;
        expiry: number;
    };
}

// API limit'lerini al
const getApiLimits = (): ApiLimits => {
    try {
        const cached = localStorage.getItem(API_LIMITS_KEY);
        if (cached) {
            const limits = JSON.parse(cached);
            // Reset time kontrolü
            const now = Date.now();
            if (limits.unsplash.resetTime < now) {
                limits.unsplash.remaining = 50; // Günlük reset
                limits.unsplash.resetTime = now + 24 * 60 * 60 * 1000;
            }
            if (limits.pixabay.resetTime < now) {
                limits.pixabay.remaining = 5000; // Günlük reset
                limits.pixabay.resetTime = now + 24 * 60 * 60 * 1000;
            }
            return limits;
        }
    } catch (error) {
        console.error('Error loading API limits:', error);
    }

    // Default limits
    const now = Date.now();
    return {
        unsplash: {
            remaining: 50,
            resetTime: now + 24 * 60 * 60 * 1000
        },
        pixabay: {
            remaining: 5000,
            resetTime: now + 24 * 60 * 60 * 1000
        }
    };
};

// API limit'ini güncelle
const updateApiLimit = (api: 'unsplash' | 'pixabay'): void => {
    try {
        const limits = getApiLimits();
        limits[api].remaining = Math.max(0, limits[api].remaining - 1);
        localStorage.setItem(API_LIMITS_KEY, JSON.stringify(limits));
    } catch (error) {
        console.error('Error updating API limit:', error);
    }
};

// API limit'lerini dışa aktar
export const getRemainingLimits = (): { unsplash: number; pixabay: number } => {
    const limits = getApiLimits();
    return {
        unsplash: limits.unsplash.remaining,
        pixabay: limits.pixabay.remaining
    };
};

// Eski cache formatını temizle ve yeni formata geç
export const migrateCacheToNewFormat = (): void => {
    try {
        console.log('🔄 Migrating cache to new format...');

        // Eski format cache'leri bul ve temizle
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('word-image-cache-') && key !== 'word-image-cache') {
                keysToRemove.push(key);
            }
        }

        // Eski cache'leri sil
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Removed old cache key:', key);
        });

        console.log('✅ Cache migration completed. Removed', keysToRemove.length, 'old cache entries.');
    } catch (error) {
        console.error('❌ Error during cache migration:', error);
    }
};

// Cache'den resim URL'ini al - kelime bazlı
const getCachedImage = (word: string): { url: string; source: string } | null => {
    try {
        const cached = localStorage.getItem(IMAGE_CACHE_KEY);
        if (cached) {
            const cacheData: ImageCacheData = JSON.parse(cached);
            const wordKey = word.toLowerCase();

            if (cacheData[wordKey]) {
                const data = cacheData[wordKey];
                if (data.expiry > Date.now()) {
                    console.log('✅ Found cached image for:', word);
                    return { url: data.url, source: data.source };
                } else {
                    console.log('⏰ Cache expired for word:', word);
                    // Expired olanı sil
                    delete cacheData[wordKey];
                    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheData));
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error reading cached image:', error);
        return null;
    }
};

// Resim URL'ini cache'e kaydet - kelime bazlı
const setCachedImage = (word: string, url: string, source: string): void => {
    try {
        const cached = localStorage.getItem(IMAGE_CACHE_KEY);
        const cacheData: ImageCacheData = cached ? JSON.parse(cached) : {};

        const wordKey = word.toLowerCase();
        cacheData[wordKey] = {
            url,
            source: source as 'unsplash' | 'pixabay' | 'cache',
            timestamp: Date.now(),
            expiry: Date.now() + CACHE_EXPIRY
        };

        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheData));
        console.log('💾 Cached image for:', word);
    } catch (error) {
        console.error('Error caching image:', error);
    }
};

// Kelime için arama terimini optimize et
const getSearchQuery = (word: string): string => {
    const cleanWord = word.toLowerCase().trim();

    // Soyut kelimeler için özel arama terimleri
    const abstractMappings: { [key: string]: string } = {
        'consequently': 'consequence result effect',
        'therefore': 'therefore conclusion result',
        'however': 'however but contrast',
        'moreover': 'moreover addition plus',
        'furthermore': 'furthermore additional',
        'nevertheless': 'nevertheless despite',
        'meanwhile': 'meanwhile time clock',
        'otherwise': 'otherwise alternative choice',
        'likewise': 'likewise similar same',
        'indeed': 'indeed truth fact'
    };

    return abstractMappings[cleanWord] || cleanWord;
};

// Unsplash API'den resim ara
const searchUnsplash = async (query: string): Promise<string | null> => {
    console.log('🔵 Searching Unsplash for:', query);

    const apiKey = getApiKey('unsplash');
    if (!apiKey) {
        console.error('❌ Unsplash API key not found');
        return null;
    }

    const limits = getApiLimits();
    if (limits.unsplash.remaining <= 0) {
        console.log('❌ Unsplash daily limit reached');
        return null;
    }

    console.log('🔵 Unsplash remaining calls:', limits.unsplash.remaining);

    try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${apiKey}`;
        console.log('🔵 Unsplash API URL:', url);

        const response = await fetch(url);

        console.log('🔵 Unsplash response status:', response.status);

        if (!response.ok) {
            console.error('❌ Unsplash API error:', response.status);
            return null;
        }

        const data: UnsplashResponse = await response.json();
        console.log('🔵 Unsplash response data:', data);

        if (data.results && data.results.length > 0) {
            const imageUrl = data.results[0].urls.small;
            console.log('✅ Unsplash found image:', imageUrl);
            updateApiLimit('unsplash');
            return imageUrl;
        }

        console.log('❌ No results from Unsplash');
        return null;
    } catch (error) {
        console.error('❌ Unsplash API error:', error);
        return null;
    }
};

// Pixabay API'den resim ara
const searchPixabay = async (query: string): Promise<string | null> => {
    console.log('🟢 Searching Pixabay for:', query);

    const apiKey = getApiKey('pixabay');
    if (!apiKey) {
        console.error('❌ Pixabay API key not found');
        return null;
    }

    const limits = getApiLimits();
    if (limits.pixabay.remaining <= 0) {
        console.log('❌ Pixabay daily limit reached');
        return null;
    }

    console.log('🟢 Pixabay remaining calls:', limits.pixabay.remaining);

    try {
        const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&safesearch=true`;
        console.log('🟢 Pixabay API URL:', url);

        const response = await fetch(url);

        console.log('🟢 Pixabay response status:', response.status);

        if (!response.ok) {
            console.error('❌ Pixabay API error:', response.status);
            return null;
        }

        const data: PixabayResponse = await response.json();
        console.log('🟢 Pixabay response data:', data);

        if (data.hits && data.hits.length > 0) {
            const imageUrl = data.hits[0].webformatURL;
            console.log('✅ Pixabay found image:', imageUrl);
            updateApiLimit('pixabay');
            return imageUrl;
        }

        console.log('❌ No results from Pixabay');
        return null;
    } catch (error) {
        console.error('❌ Pixabay API error:', error);
        return null;
    }
};

// Kullanıcı tercihini al
const getImageApiPreference = (): string => {
    try {
        return localStorage.getItem('word-rating-system-image-api-preference') || 'auto';
    } catch {
        return 'auto';
    }
};

// Hibrit sistem: Unsplash + Pixabay (kullanıcı tercihine göre)
export const getWordImage = async (word: string, forceReload = false): Promise<{ url: string | null; source: string }> => {
    console.log('🔍 getWordImage called with word:', word, 'forceReload:', forceReload);

    // Force reload değilse önce cache'den kontrol et
    if (!forceReload) {
        const cachedImage = getCachedImage(word);
        if (cachedImage) {
            console.log('✅ Found cached image for:', word);
            return { url: cachedImage.url, source: cachedImage.source };
        }
        console.log('❌ No cached image found for:', word);
    } else {
        // Force reload durumunda cache'i temizle
        try {
            const cached = localStorage.getItem(IMAGE_CACHE_KEY);
            if (cached) {
                const cacheData: ImageCacheData = JSON.parse(cached);
                const wordKey = word.toLowerCase();
                delete cacheData[wordKey];
                localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheData));
                console.log('🗑️ Cache cleared for:', word);
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    const searchQuery = getSearchQuery(word);
    const preference = getImageApiPreference();

    // Kullanıcı tercihine göre API sırasını belirle
    console.log('🔍 Search query:', searchQuery);
    console.log('🔍 API preference:', preference);

    if (preference === 'unsplash') {
        // Sadece Unsplash kullan
        console.log('📸 Searching Unsplash only...');
        const unsplashImage = await searchUnsplash(searchQuery);
        if (unsplashImage) {
            console.log('✅ Found in Unsplash:', unsplashImage);
            setCachedImage(word, unsplashImage, 'unsplash');
            return { url: unsplashImage, source: 'unsplash' };
        }
        console.log('❌ No image found in Unsplash');
    } else if (preference === 'pixabay') {
        // Sadece Pixabay kullan
        console.log('📸 Searching Pixabay only...');
        const pixabayImage = await searchPixabay(searchQuery);
        if (pixabayImage) {
            console.log('✅ Found in Pixabay:', pixabayImage);
            setCachedImage(word, pixabayImage, 'pixabay');
            return { url: pixabayImage, source: 'pixabay' };
        }
        console.log('❌ No image found in Pixabay');
    } else {
        // Auto mode: Unsplash önce, sonra Pixabay
        console.log('📸 Auto mode - searching Unsplash first...');
        const unsplashImage = await searchUnsplash(searchQuery);
        if (unsplashImage) {
            console.log('✅ Found in Unsplash:', unsplashImage);
            setCachedImage(word, unsplashImage, 'unsplash');
            return { url: unsplashImage, source: 'unsplash' };
        }
        console.log('❌ No image found in Unsplash, trying Pixabay...');

        const pixabayImage = await searchPixabay(searchQuery);
        if (pixabayImage) {
            console.log('✅ Found in Pixabay:', pixabayImage);
            setCachedImage(word, pixabayImage, 'pixabay');
            return { url: pixabayImage, source: 'pixabay' };
        }
        console.log('❌ No image found in Pixabay either');
    }

    // Hiçbirinde bulamazsa null döndür
    return { url: null, source: 'none' };
};

// Resim yükleme durumunu kontrol et
export const preloadImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};
