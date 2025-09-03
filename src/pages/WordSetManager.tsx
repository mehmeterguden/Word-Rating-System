import React, { useState } from 'react';
import { WordSet } from '../types';

interface WordSetManagerProps {
  wordSets: WordSet[];
  activeSetId: string | null;
  onSetActive: (setId: string) => void;
  onCreateSet: (name: string, description?: string) => void;
  onDeleteSet: (setId: string) => void;
  onUpdateSet: (setId: string, name: string, description?: string) => void;
  onExportToExcel: (setId: string) => void;
  onExportToText: (setId: string) => void;
  onClose: () => void;
}

const WordSetManager: React.FC<WordSetManagerProps> = ({
  wordSets,
  activeSetId,
  onSetActive,
  onCreateSet,
  onDeleteSet,
  onUpdateSet,
  onExportToExcel,
  onExportToText,
  onClose
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [editSetName, setEditSetName] = useState('');
  const [editSetDescription, setEditSetDescription] = useState('');

  const handleCreateSet = () => {
    if (newSetName.trim()) {
      onCreateSet(newSetName.trim(), newSetDescription.trim() || undefined);
      setNewSetName('');
      setNewSetDescription('');
      setShowCreateForm(false);
    }
  };

  const handleEditSet = (set: WordSet) => {
    setEditingSetId(set.id);
    setEditSetName(set.name);
    setEditSetDescription(set.description || '');
  };

  const handleSaveEdit = () => {
    if (editSetName.trim() && editingSetId) {
      onUpdateSet(editingSetId, editSetName.trim(), editSetDescription.trim() || undefined);
      setEditingSetId(null);
      setEditSetName('');
      setEditSetDescription('');
    }
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    setEditSetName('');
    setEditSetDescription('');
  };

  const handleDeleteSet = (setId: string) => {
    if (wordSets.length > 1) {
      onDeleteSet(setId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">Word Sets</h1>
            <p className="text-xl text-blue-100">
              Organize and manage your word collections
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Create New Set Form */}
          {showCreateForm && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Set
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Name
                  </label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="Enter set name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateSet}
                    disabled={!newSetName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                  >
                    Create Set
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSetName('');
                      setNewSetDescription('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold text-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Word Sets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordSets.map((set) => (
              <div
                key={set.id}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                  set.id === activeSetId
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-lg'
                }`}
              >
                {/* Active Badge */}
                {set.id === activeSetId && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Active
                  </div>
                )}

                {/* Set Content */}
                {editingSetId === set.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set Name
                      </label>
                      <input
                        type="text"
                        value={editSetName}
                        onChange={(e) => setEditSetName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editSetDescription}
                        onChange={(e) => setEditSetDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editSetName.trim()}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          set.id === activeSetId ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'
                        }`}></div>
                        <h3 className="text-xl font-semibold text-gray-800">{set.name}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditSet(set)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {wordSets.length > 1 && (
                          <button
                            onClick={() => handleDeleteSet(set.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {set.description && (
                      <p className="text-gray-600 mb-4">{set.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Words</span>
                        <span className="font-semibold text-gray-800">{set.wordCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-800">{new Date(set.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Export Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => onExportToExcel(set.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => onExportToText(set.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Text</span>
                      </button>
                    </div>
                    
                    {set.id !== activeSetId && (
                      <button
                        onClick={() => onSetActive(set.id)}
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        Activate Set
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create New Set Button */}
          {!showCreateForm && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                + Create New Set
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center mt-8">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold text-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSetManager;
