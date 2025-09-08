import React, { useState, useEffect } from 'react';
import { getWordImage, preloadImage, getRemainingLimits } from '../utils/imageApi';

interface ImageModalProps {
  word: string;
  languageName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ word, languageName, isOpen, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [apiLimits, setApiLimits] = useState({ unsplash: 50, pixabay: 5000 });
  const [apiPreference, setApiPreference] = useState('auto');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  // API limit'lerini ve tercihini güncelle
  useEffect(() => {
    const updateLimits = () => {
      setApiLimits(getRemainingLimits());
    };
    
    const updatePreference = () => {
      try {
        const preference = localStorage.getItem('word-rating-system-image-api-preference') || 'auto';
        setApiPreference(preference);
      } catch {
        setApiPreference('auto');
      }
    };
    
    updateLimits();
    updatePreference();
    const interval = setInterval(() => {
      updateLimits();
      updatePreference();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Resim yükleme fonksiyonu
  const loadImage = async (forceReload = false) => {
    console.log('🖼️ loadImage called with forceReload:', forceReload);
    console.log('🖼️ Current state - imageUrl:', imageUrl, 'imageLoading:', imageLoading);
    
    if (imageUrl && !forceReload) {
      console.log('✅ Image already loaded, skipping load');
      return; // Zaten yüklenmiş
    }

    console.log('🔄 Starting image load process...');
    setImageLoading(true);
    setImageError(false);
    
    if (forceReload) {
      console.log('🗑️ Force reload - clearing current image');
      setImageUrl(null);
      setImageSource('');
      setImageLoadError(false);
      setShowGenerateButton(false);
    }

    try {
      console.log('🖼️ Loading image for word:', word, 'forceReload:', forceReload);
      const result = await getWordImage(word, forceReload);
      
      if (result.url) {
        console.log('📥 Image URL received:', result.url);
        setImageUrl(result.url);
        setImageSource(result.source);
        
        // Resmi preload et
        const loaded = await preloadImage(result.url);
        if (loaded) {
          console.log('✅ Image preloaded successfully:', result.source);
          setImageLoadError(false);
          setShowGenerateButton(false);
        } else {
          console.log('❌ Image preload failed, but URL is set');
          setImageLoadError(true);
          setShowGenerateButton(true);
        }
      } else {
        console.log('❌ No image URL returned from API');
        setImageError(true);
        setImageLoadError(true);
        setShowGenerateButton(true);
      }
    } catch (error) {
      console.error('❌ Error loading image:', error);
      setImageError(true);
      setImageLoadError(true);
      setShowGenerateButton(true);
    } finally {
      setImageLoading(false);
    }
  };

  // Reload fonksiyonu
  const handleReload = () => {
    console.log('🔄 Reload button clicked for word:', word);
    console.log('🔄 Current imageUrl before reload:', imageUrl);
    console.log('🔄 Current imageSource before reload:', imageSource);
    loadImage(true);
  };

  // Generate Image fonksiyonu
  const handleGenerateImage = () => {
    console.log('🎨 Generate Image button clicked for word:', word);
    loadImage(true);
  };

  // Modal açıldığında resmi yükle
  useEffect(() => {
    if (isOpen && !imageUrl) {
      loadImage();
    }
  }, [isOpen, word]);

  // Resim yükleme durumunu kontrol et
  useEffect(() => {
    if (imageUrl && !imageLoading) {
      console.log('🔍 Checking image load status for URL:', imageUrl);
      // Resim URL'i var ama yüklenmemiş olabilir
      const img = new Image();
      img.onload = () => {
        console.log('✅ Image loaded successfully in DOM');
        setImageLoadError(false);
        setShowGenerateButton(false);
      };
      img.onerror = () => {
        console.log('❌ Image failed to load in DOM');
        setImageLoadError(true);
        setShowGenerateButton(true);
      };
      img.src = imageUrl;
      
      // 3 saniye sonra hala yüklenmemişse hata olarak işaretle
      const timeout = setTimeout(() => {
        if (img.complete === false) {
          console.log('⏰ Image load timeout');
          setImageLoadError(true);
          setShowGenerateButton(true);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [imageUrl, imageLoading]);

  // Kelime değiştiğinde state'leri sıfırla
  useEffect(() => {
    setImageUrl(null);
    setImageSource('');
    setImageError(false);
    setImageLoading(false);
    setImageLoadError(false);
    setShowGenerateButton(false);
  }, [word]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{word}</h3>
              {languageName && (
                <p className="text-sm text-slate-500">{languageName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-4">
          {imageLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center animate-spin">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading image...</h3>
              <p className="text-slate-500">Searching for "{word}"</p>
            </div>
          ) : imageError || imageLoadError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {imageLoadError ? 'Image Failed to Load' : 'Image Not Found'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                {imageLoadError 
                  ? `The image for "${word}" couldn't be displayed. This might be due to network issues or the image being unavailable.`
                  : `Sorry, we couldn't find an image for "${word}". Try generating a new one or check your internet connection.`
                }
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateImage}
                  disabled={imageLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className={`w-5 h-5 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {imageLoading ? 'Generating...' : 'Generate Image'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="relative">
              {imageLoadError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Image Failed to Load</h3>
                  <p className="text-slate-500 mb-6 max-w-md">
                    The image for "{word}" couldn't be displayed. This might be due to network issues or the image being unavailable.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateImage}
                      disabled={imageLoading}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className={`w-5 h-5 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={word}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={() => {
                    console.log('❌ Image failed to load in DOM');
                    setImageLoadError(true);
                    setShowGenerateButton(true);
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully in DOM');
                    setImageLoadError(false);
                    setShowGenerateButton(false);
                  }}
                />
              )}
              {!imageLoadError && (
                <>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={handleReload}
                      disabled={imageLoading}
                      className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reload image"
                    >
                      <svg className={`w-4 h-4 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {showGenerateButton && (
                      <button
                        onClick={handleGenerateImage}
                        disabled={imageLoading}
                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate new image"
                      >
                        <svg className={`w-4 h-4 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    via {imageSource === 'unsplash' ? 'Unsplash' : imageSource === 'pixabay' ? 'Pixabay' : 'Cache'}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Image Available</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                No image has been generated for "{word}" yet. Click the button below to create one.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateImage}
                  disabled={imageLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className={`w-5 h-5 ${imageLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {imageLoading ? 'Generating...' : 'Generate Image'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* API Limits Display */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Unsplash: {apiLimits.unsplash}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Pixabay: {apiLimits.pixabay}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                {apiPreference === 'auto' ? 'Auto' : apiPreference === 'unsplash' ? 'Unsplash Only' : 'Pixabay Only'}
              </span>
              <span>Daily limits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
