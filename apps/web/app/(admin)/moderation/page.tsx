'use client';

import { useState, useEffect } from 'react';
import { safeFetch } from '@/lib/safe-fetch';

interface FlaggedContent {
  id: string;
  type: 'thread' | 'reply';
  content: string;
  author: {
    username: string;
    id: string;
  };
  flaggedReason: string[];
  toxicityScore?: number;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ModerationPage() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  useEffect(() => {
    loadFlaggedContent();
  }, [filter]);

  const loadFlaggedContent = async () => {
    setLoading(true);
    try {
      const response = await safeFetch(`/api/forum/moderate?status=${filter}`);
      if (response.ok) {
        setFlaggedContent(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load flagged content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'lock') => {
    try {
      const response = await safeFetch(`/api/forum/moderate/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadFlaggedContent(); // Refresh list
      }
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
    }
  };

  const getSeverityColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score > 0.7) return 'text-red-400';
    if (score > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSeverityBadge = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score > 0.7) return 'bg-red-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-lg animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Content Moderation</h1>
          <p className="text-gray-400">Review and moderate flagged forum content</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Pending ({flaggedContent.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {flaggedContent.length === 0 ? (
            <div className="bg-gray-800 p-12 rounded-lg text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-lg">No flagged content to review</p>
            </div>
          ) : (
            flaggedContent.map((item) => (
              <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadge(item.toxicityScore)}`}>
                        {item.type.toUpperCase()}
                      </span>
                      {item.toxicityScore !== undefined && (
                        <span className={`font-mono text-sm ${getSeverityColor(item.toxicityScore)}`}>
                          Toxicity: {(item.toxicityScore * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">
                        by {item.author.username}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(item.flaggedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.flaggedReason.map((reason, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs">
                          {reason}
                        </span>
                      ))}
                    </div>

                    <div className="bg-gray-900 p-4 rounded border border-gray-700">
                      <p className="text-gray-300 whitespace-pre-wrap">{item.content}</p>
                    </div>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleAction(item.id, 'approve')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject & Remove
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'lock')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Lock Thread
                    </button>
                  </div>
                )}

                {item.status !== 'pending' && (
                  <div className="pt-4 border-t border-gray-700">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'approved' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
