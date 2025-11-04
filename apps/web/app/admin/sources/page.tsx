
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Check, X } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  kind: string;
  tags: string[];
  lastFetched?: string;
  failureCount: number;
}

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (sourceId: string, enabled: boolean) => {
    setUpdating(sourceId);
    try {
      const res = await fetch('/api/admin/feed-poller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, enabled }),
      });

      if (res.ok) {
        setSources(prev =>
          prev.map(s => (s.id === sourceId ? { ...s, enabled } : s))
        );
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    } finally {
      setUpdating(null);
    }
  };

  const triggerRefresh = async (sourceId: string) => {
    setUpdating(sourceId);
    try {
      const res = await fetch(`/api/admin/refresh?sourceId=${sourceId}`, {
        method: 'POST',
        headers: { 'x-refresh-key': process.env.NEXT_PUBLIC_REFRESH_API_KEY || 'dev-key' },
      });

      if (res.ok) {
        alert('Refresh triggered successfully');
      }
    } catch (error) {
      console.error('Failed to trigger refresh:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <p className="text-gray-400">Loading sources...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Feed Sources Management</h1>
          <p className="text-gray-400 text-sm">Manage content feed sources</p>
        </div>
        <Button onClick={fetchSources} variant="outline" className="border-[#1a1a1a]">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh List
        </Button>
      </div>

      <div className="grid gap-4">
        {sources.map(source => (
          <Card key={source.id} className="bg-[#111111] border-[#1a1a1a] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">{source.name}</h3>
                  <span className="text-xs px-2 py-1 bg-[#1a1a1a] rounded text-gray-400">
                    {source.kind}
                  </span>
                  {source.enabled ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2 break-all">
                  {source.url}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {source.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-[#D1FF3D]/10 text-[#D1FF3D] rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {source.lastFetched && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last fetched: {new Date(source.lastFetched).toLocaleString()}
                  </p>
                )}
                {source.failureCount > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Failures: {source.failureCount}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.enabled}
                    onCheckedChange={checked => toggleSource(source.id, checked)}
                    disabled={updating === source.id}
                  />
                  <span className="text-sm text-gray-400">
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerRefresh(source.id)}
                  disabled={updating === source.id || !source.enabled}
                  className="border-[#1a1a1a]"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sources.length === 0 && (
        <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
          <p className="text-gray-400">
            No sources found. Run the seed script to populate sources.
          </p>
        </Card>
      )}
    </div>
  );
}
