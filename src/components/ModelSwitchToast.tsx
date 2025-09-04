import React, { useEffect, useState } from 'react';

interface ModelSwitchToastProps {
  isVisible: boolean;
  fromModel: string;
  toModel: string;
  reason: string;
  onClose: () => void;
}

const ModelSwitchToast: React.FC<ModelSwitchToastProps> = ({
  isVisible,
  fromModel,
  toModel,
  reason,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-2xl border border-blue-400 max-w-sm">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-1">
                AI Model Switched
              </div>
              <div className="text-xs text-blue-100 space-y-1">
                <div>
                  <span className="font-medium">From:</span> {fromModel}
                </div>
                <div>
                  <span className="font-medium">To:</span> {toModel}
                </div>
                <div className="text-blue-200">
                  <span className="font-medium">Reason:</span> {reason}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAnimating(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSwitchToast;
