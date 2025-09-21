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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-blue-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Word Sets
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              Organize and manage your word collections
            </p>
            
            {/* Statistics Preview */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-4">
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">{wordSets.length}</div>
                <div className="text-xs text-slate-600">Total Sets</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-indigo-600 mb-1">{wordSets.reduce((sum, set) => sum + set.wordCount, 0)}</div>
                <div className="text-xs text-slate-600">Total Words</div>
              </div>
              <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm border border-blue-200/50 text-center">
                <div className="text-xl font-bold text-blue-700 mb-1">{activeSetId ? '1' : '0'}</div>
                <div className="text-xs text-slate-600">Active Set</div>
              </div>
            </div>

            {/* Create New Set Button */}
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create New Set</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Create New Set Form */}
        {showCreateForm && (
          <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 mb-6 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-6 -translate-x-6"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Set
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Set Name
                  </label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="Enter set name..."
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm bg-white/80"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm bg-white/80"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateSet}
                    disabled={!newSetName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Create Set
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSetName('');
                      setNewSetDescription('');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 font-semibold hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Word Sets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wordSets.map((set) => (
            <div
              key={set.id}
              className={`relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200/50 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] overflow-hidden ${
                set.id === activeSetId
                  ? 'ring-2 ring-blue-300 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-100/50'
                  : ''
              }`}
            >
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -translate-y-6 translate-x-6"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-indigo-100/40 to-blue-100/40 rounded-full translate-y-4 -translate-x-4"></div>
              
              <div className="relative z-10">
                {/* Set Content */}
                {editingSetId === set.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Set Name
                      </label>
                      <input
                        type="text"
                        value={editSetName}
                        onChange={(e) => setEditSetName(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editSetDescription}
                        onChange={(e) => setEditSetDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editSetName.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-300 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          set.id === activeSetId ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-300'
                        }`}></div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-slate-800">{set.name}</h3>
                          {set.id === activeSetId && (
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
                              Active
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditSet(set)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {wordSets.length > 1 && (
                          <button
                            onClick={() => handleDeleteSet(set.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {set.description && (
                      <p className="text-slate-600 mb-4 text-sm">{set.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Words</span>
                        <span className="font-semibold text-blue-600">{set.wordCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Created</span>
                        <span className="text-slate-700">{new Date(set.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Export Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => onExportToExcel(set.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1 hover:scale-105 active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => onExportToText(set.id)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-1 hover:scale-105 active:scale-95"
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
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        Activate Set
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
};

export default WordSetManager;