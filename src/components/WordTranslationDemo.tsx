import React from 'react';
import { useWordTranslation } from '../hooks/useWordTranslation';
import WordTranslationModal from './WordTranslationModal';

const WordTranslationDemo: React.FC = () => {
  const { openTranslation, modalProps } = useWordTranslation((word, translation) => {
    console.log('Added to word list:', { word, translation });
    // Here you would typically add to your word list
    alert(`Added "${word}" → "${translation}" to word list!`);
  });

  const sampleWords = [
    { word: 'hello', source: 'English', target: 'Turkish' },
    { word: 'merhaba', source: 'Turkish', target: 'English' },
    { word: 'bonjour', source: 'French', target: 'English' },
    { word: 'hola', source: 'Spanish', target: 'English' },
    { word: 'guten', source: 'German', target: 'English' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Word Translation Demo</h1>
        <p className="text-gray-600 mb-6">
          Click on any word below to see the translation modal in action. 
          You can listen to pronunciations and add words to your list.
        </p>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Sample Words:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleWords.map((item, index) => (
              <button
                key={index}
                onClick={() => openTranslation(item.word, item.source, item.target)}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                      {item.word}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.source} → {item.target}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Usage Instructions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click on any word to open the translation modal</li>
            <li>• Listen to pronunciations in both source and target languages</li>
            <li>• Choose from alternative translations</li>
            <li>• Add words to your word list for later study</li>
            <li>• Edit translations before adding to your list</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Integration Code:</h3>
          <pre className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg overflow-x-auto">
{`import { useWordTranslation } from './hooks/useWordTranslation';
import WordTranslationModal from './components/WordTranslationModal';

const MyComponent = () => {
  const { openTranslation, modalProps } = useWordTranslation((word, translation) => {
    // Handle adding to word list
    console.log('Added:', word, '→', translation);
  });

  return (
    <>
      <button onClick={() => openTranslation('hello', 'English', 'Turkish')}>
        Translate "hello"
      </button>
      <WordTranslationModal {...modalProps} />
    </>
  );
};`}
          </pre>
        </div>
      </div>

      {/* Modal */}
      <WordTranslationModal {...modalProps} />
    </div>
  );
};

export default WordTranslationDemo;
