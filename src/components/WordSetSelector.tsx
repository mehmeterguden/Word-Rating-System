import React, { useState, useEffect, useRef } from 'react';
import { WordSet } from '../types';

interface WordSetSelectorProps {
  wordSets: WordSet[];
  activeSetId: string | null;
  onSetActive: (setId: string) => void;
  onCreateSet: (name: string, description?: string) => void;
  onDeleteSet: (setId: string) => void;
}

const WordSetSelector: React.FC<WordSetSelectorProps> = ({
  wordSets,
  activeSetId,
  onSetActive,
  onCreateSet,
  onDeleteSet
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSet = wordSets.find(set => set.id === activeSetId);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateSet = () => {
    if (newSetName.trim()) {
      onCreateSet(newSetName.trim(), newSetDescription.trim() || undefined);
      setNewSetName('');
      setNewSetDescription('');
      setShowCreateForm(false);
      setIsOpen(false);
    }
  };

  const handleDeleteSet = (setId: string) => {
    if (wordSets.length > 1) {
      onDeleteSet(setId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Set Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
      >
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span className="font-medium text-gray-700">
          {activeSet ? activeSet.name : 'Select Set'}
        </span>
        <span className="text-sm text-gray-500">
          ({activeSet ? activeSet.wordCount : 0} words)
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="space-y-2">
              {wordSets.map((set) => (
                <div
                  key={set.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    set.id === activeSetId
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => {
                    onSetActive(set.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      set.id === activeSetId ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-800">{set.name}</div>
                      {set.description && (
                        <div className="text-sm text-gray-500">{set.description}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        {set.wordCount} words • Created {new Date(set.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {wordSets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSet(set.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create New Set Button */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-3 p-3 text-blue-600 hover:bg-blue-50 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-200 font-medium"
              >
                + Create New Set
              </button>
            ) : (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Set Name
                    </label>
                    <input
                      type="text"
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      placeholder="Enter set name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={newSetDescription}
                      onChange={(e) => setNewSetDescription(e.target.value)}
                      placeholder="Enter description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateSet}
                      disabled={!newSetName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewSetName('');
                        setNewSetDescription('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSetSelector;
