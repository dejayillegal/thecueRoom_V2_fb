'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Rss, Clock, Database, Shield, Save, 
  Loader2, CheckCircle2, RefreshCw, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppConfig {
  feedPollingInterval: number;
  maxFeedsPerCycle: number;
  enableAutoRefresh: boolean;
  enableRateLimiting: boolean;
  aiCreditsPerUser: number;
  verificationRequired: boolean;
}

interface FeedSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  tags: string[];
  lastFetchedAt?: string;
  consecutiveFailures: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [config, setConfig] = useState<AppConfig>({
    feedPollingInterval: 60,
    maxFeedsPerCycle: 25,
    enableAutoRefresh: true,
    enableRateLimiting: true,
    aiCreditsPerUser: 100,
    verificationRequired: false,
  });

  const [feedSources, setFeedSources] = useState<FeedSource[]>([]);
  const [stats, setStats] = useState({
    totalFeeds: 0,
    activeFeeds: 0,
    totalSources: 0,
    activeSources: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        router.push('/');
        return;
      }

      const data = await response.json();
      if (data.user?.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchConfig(), fetchFeedSources(), fetchStats()]);
    } catch (err) {
      console.error('Admin access check failed:', err);
      router.push('/');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const fetchFeedSources = async () => {
    try {
      const response = await fetch('/api/sources');
      if (response.ok) {
        const data = await response.json();
        setFeedSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError('');
      setSaved(false);

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSource = async (sourceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setFeedSources(sources =>
          sources.map(s => s.id === sourceId ? { ...s, enabled } : s)
        );
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle source:', err);
    }
  };

  const handleRefreshFeeds = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to refresh feeds:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <div className="grain-overlay" />
      
      <header className="sticky top-0 z-50 bg-[#0b0b0b]/95 border-b border-[#222] backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6 text-[#D7FF3C]" />
            <h1 className="text-xl font-bold text-white">Admin Settings</h1>
          </div>
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save All</>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#111] border-[#222]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#D7FF3C]" />
                Total Feeds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{stats.totalFeeds}</div>
              <p className="text-sm text-gray-400 mt-1">Stored in database</p>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-[#222]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Rss className="w-5 h-5 text-[#9B5CFF]" />
                Active Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">
                {stats.activeSources} <span className="text-2xl text-gray-500">/ {stats.totalSources}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Currently enabled</p>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-[#222]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#D7FF3C]" />
                Active Feeds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">
                {stats.activeFeeds}
              </div>
              <p className="text-sm text-gray-400 mt-1">Recent items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" />
                  Feed Polling Configuration
                </CardTitle>
                <CardDescription>Control how often feeds are fetched</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Polling Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={config.feedPollingInterval}
                    onChange={(e) => setConfig({ ...config, feedPollingInterval: parseInt(e.target.value) })}
                    min="5"
                    max="1440"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-500">
                    How often to check for new feed items (5-1440 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Max Feeds Per Cycle</Label>
                  <Input
                    type="number"
                    value={config.maxFeedsPerCycle}
                    onChange={(e) => setConfig({ ...config, maxFeedsPerCycle: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Maximum sources to fetch per polling cycle
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="text-gray-300">Auto-Refresh Enabled</Label>
                    <p className="text-sm text-gray-500">Automatically poll feeds on schedule</p>
                  </div>
                  <Switch
                    checked={config.enableAutoRefresh}
                    onCheckedChange={(checked) => setConfig({ ...config, enableAutoRefresh: checked })}
                  />
                </div>

                <Button
                  onClick={handleRefreshFeeds}
                  disabled={refreshing}
                  className="w-full bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90"
                >
                  {refreshing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Refreshing...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Refresh Feeds Now</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5" />
                  App Configuration
                </CardTitle>
                <CardDescription>General application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Default AI Credits Per User</Label>
                  <Input
                    type="number"
                    value={config.aiCreditsPerUser}
                    onChange={(e) => setConfig({ ...config, aiCreditsPerUser: parseInt(e.target.value) })}
                    min="0"
                    max="10000"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Credits given to new users for AI features
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="text-gray-300">Rate Limiting</Label>
                    <p className="text-sm text-gray-500">Limit API request rates</p>
                  </div>
                  <Switch
                    checked={config.enableRateLimiting}
                    onCheckedChange={(checked) => setConfig({ ...config, enableRateLimiting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="text-gray-300">Verification Required</Label>
                    <p className="text-sm text-gray-500">Require artist verification for full access</p>
                  </div>
                  <Switch
                    checked={config.verificationRequired}
                    onCheckedChange={(checked) => setConfig({ ...config, verificationRequired: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#111] border-[#222]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Rss className="w-5 h-5" />
                Feed Sources Management
              </CardTitle>
              <CardDescription>
                Enable or disable individual feed sources ({feedSources.filter(s => s.enabled).length} active)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {feedSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#333]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {source.name}
                        </h4>
                        {source.consecutiveFailures > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                            {source.consecutiveFailures} fails
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-2">{source.url}</p>
                      <div className="flex flex-wrap gap-1">
                        {source.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-[#D7FF3C]/10 text-[#D7FF3C] rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {source.lastFetchedAt && (
                        <p className="text-xs text-gray-600 mt-2">
                          Last fetched: {new Date(source.lastFetchedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={(checked) => handleToggleSource(source.id, checked)}
                      className="ml-4 flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
