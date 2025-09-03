import React from 'react';

const DebugPage: React.FC = () => {
  const debugInfo = {
    localStorage: {
      words: localStorage.getItem('word-rating-system-words'),
      sets: localStorage.getItem('word-rating-system-sets'),
      activeSet: localStorage.getItem('word-rating-system-active-set'),
      defaultLanguages: localStorage.getItem('word-rating-system-default-languages')
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-t-2xl">
        <h1 className="text-3xl font-bold">Debug Information</h1>
        <p className="text-red-100">System diagnostics and troubleshooting</p>
      </div>
      
      <div className="bg-white rounded-b-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* localStorage Data */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">localStorage Data</h2>
            <div className="grid gap-4">
              {Object.entries(debugInfo.localStorage).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">{key}</h3>
                  <pre className="text-sm text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                    {value ? JSON.stringify(JSON.parse(value), null, 2) : 'null'}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* System Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">User Agent</h3>
                  <p className="text-sm text-gray-600 break-all">{debugInfo.userAgent}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Timestamp</h3>
                  <p className="text-sm text-gray-600">{debugInfo.timestamp}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear All Data & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
