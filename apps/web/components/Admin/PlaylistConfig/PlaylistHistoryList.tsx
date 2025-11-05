
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, RotateCcw } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action: string;
  snapshot: any;
  createdAt: string;
}

interface PlaylistHistoryListProps {
  history: HistoryEntry[];
  onRollback?: (historyId: string) => void;
  loading?: boolean;
}

export function PlaylistHistoryList({ history, onRollback, loading = false }: PlaylistHistoryListProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-lime-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Playlist History</h3>
        </div>
        <p className="text-neutral-400 text-sm">No history available yet</p>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="text-lime-500" size={20} />
        <h3 className="text-lg font-semibold text-white">Playlist History</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-white font-medium">{entry.snapshot.title}</p>
              <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1">
                <span className="capitalize">{entry.action}</span>
                <span>•</span>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            </div>
            
            {onRollback && entry.action === 'published' && (
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-700"
                onClick={() => onRollback(entry.id)}
                disabled={loading}
              >
                <RotateCcw size={14} className="mr-2" />
                Rollback
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
