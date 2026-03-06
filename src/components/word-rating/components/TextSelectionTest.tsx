import React from 'react';

const TextSelectionTest: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Text Selection Test</h1>
                    <p className="text-gray-600 mb-8">
                        Bu sayfada kelime seçimi sistemini test edebilirsiniz. Aşağıdaki metinlerden herhangi bir kelimeyi seçin ve çeviri container'ının açıldığını görün.
                    </p>

                    <div className="space-y-8">
                        {/* English Text */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-blue-800 mb-4">English Text</h2>
                            <p className="text-gray-800 leading-relaxed">
                                The quick brown fox jumps over the lazy dog. This is a sample text for testing word selection.
                                You can select any word from this paragraph and see the translation container appear.
                                Try selecting words like "quick", "brown", "fox", "jumps", "lazy", or "dog".
                            </p>
                        </div>

                        {/* Turkish Text */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-green-800 mb-4">Turkish Text</h2>
                            <p className="text-gray-800 leading-relaxed">
                                Hızlı kahverengi tilki tembel köpeğin üzerinden atlar. Bu kelime seçimi testi için örnek bir metindir.
                                Bu paragraftan herhangi bir kelimeyi seçebilir ve çeviri container'ının göründüğünü görebilirsiniz.
                                "hızlı", "kahverengi", "tilki", "atlar", "tembel", "köpek" gibi kelimeleri seçmeyi deneyin.
                            </p>
                        </div>

                        {/* Mixed Text */}
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-purple-800 mb-4">Mixed Language Text</h2>
                            <p className="text-gray-800 leading-relaxed">
                                Bu metinde hem English hem de Turkish kelimeler var. You can select words from both languages.
                                Örneğin "hello" kelimesini seçebilir veya "merhaba" kelimesini seçebilirsiniz.
                                The system should work with both languages seamlessly.
                            </p>
                        </div>

                        {/* Phrase Examples */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-orange-800 mb-4">Phrase Examples</h2>
                            <p className="text-gray-800 leading-relaxed">
                                Bu bölümde kısa cümleler ve ifadeler var. Bunları da seçebilirsiniz:
                                "good morning", "how are you", "thank you very much", "see you later",
                                "have a nice day", "what time is it", "where are you going", "I love you".
                                Bu tür kısa ifadeleri de çevirebilirsiniz.
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Test Instructions</h2>
                            <ul className="text-gray-800 space-y-2">
                                <li>• <strong>Word or phrase selection:</strong> Tek kelime veya kısa cümle seçin (max 10 kelime)</li>
                                <li>• <strong>Valid selections:</strong> Harfler, rakamlar, tire (-), apostrof ('), nokta (.) içerebilir</li>
                                <li>• <strong>Length limit:</strong> 1-200 karakter arası</li>
                                <li>• <strong>Word limit:</strong> Maksimum 10 kelime</li>
                                <li>• <strong>Invalid selections:</strong> Sadece rakamlar, sadece noktalama, çok uzun metinler</li>
                                <li>• <strong>Container position:</strong> Seçilen metnin yakınında görünür</li>
                                <li>• <strong>Close methods:</strong> Dışarı tıklayın, ESC tuşuna basın, veya Close butonuna tıklayın</li>
                            </ul>

                            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                                <p className="text-green-800 text-sm font-medium">
                                    ✅ Nasıl Test Edilir:
                                </p>
                                <ol className="text-green-700 text-sm mt-1 space-y-1">
                                    <li>1. Console'u açın (F12)</li>
                                    <li>2. Aşağıdaki metinlerden bir kelimeyi seçin</li>
                                    <li>3. Container'ın açıldığını görün</li>
                                    <li>4. Console'da debug mesajlarını kontrol edin</li>
                                </ol>
                            </div>
                        </div>

                        {/* Debug Info */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Information</h2>
                            <p className="text-gray-600 text-sm">
                                Browser console'da debug mesajlarını görebilirsiniz.
                                Kelime seçimi yaparken console'da şu mesajları göreceksiniz:
                            </p>
                            <ul className="text-gray-600 text-sm mt-2 space-y-1">
                                <li>• 🚀 Initializing WordSelectionProvider</li>
                                <li>• 🔧 Setting up text selection listeners...</li>
                                <li>• ✅ Text selection listeners set up</li>
                                <li>• 🎯 Text selection handler triggered</li>
                                <li>• 🔍 Text selected: [seçilen kelime]</li>
                                <li>• 🔍 Validating word: [kelime]</li>
                                <li>• ✅ Valid word selected, showing container</li>
                                <li>• ❌ Invalid word selection: [geçersiz seçim]</li>
                            </ul>

                            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                <p className="text-yellow-800 text-sm font-medium">
                                    ⚠️ Eğer container açılmıyorsa:
                                </p>
                                <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                                    <li>• Console'u açın (F12)</li>
                                    <li>• Bir kelimeyi seçin</li>
                                    <li>• Debug mesajlarını kontrol edin</li>
                                    <li>• Hangi aşamada takıldığını görün</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextSelectionTest;
