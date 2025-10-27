
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function CronAdminPage() {
  const [config, setConfig] = useState({ enabled: true, interval: 60 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/cron-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cron/ingest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const updateConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cron-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (res.ok) {
        setLastUpdate(new Date().toLocaleString());
        alert('Configuration updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/ingest');
      const data = await res.json();
      
      if (res.ok) {
        alert('Feed ingestion completed successfully!');
        fetchStatus();
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to trigger ingestion:', error);
      alert('Failed to trigger feed ingestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cron Job Configuration</h1>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Current Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {status?.isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="font-medium">
                {status?.isRunning ? 'Running' : 'Idle'}
              </span>
            </div>
            {status?.lastRun && (
              <p className="text-sm text-muted-foreground">
                Last run: {new Date(status.lastRun).toLocaleString()}
              </p>
            )}
          </div>
          <Button 
            onClick={triggerManualRun} 
            disabled={loading || status?.isRunning}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Trigger Manual Run
          </Button>
        </Card>

        {/* Configuration Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="enabled" className="font-medium">
                Enable automatic feed ingestion
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Interval (minutes)</Label>
              <Input
                type="number"
                id="interval"
                value={config.interval}
                onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 60 })}
                min="1"
                max="1440"
              />
              <p className="text-sm text-muted-foreground">
                Current: Every {config.interval} minutes ({(config.interval / 60).toFixed(1)} hours)
              </p>
            </div>

            <Button onClick={updateConfig} disabled={loading} className="w-full">
              Save Configuration
            </Button>
            
            {lastUpdate && (
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {lastUpdate}
              </p>
            )}
          </div>
        </Card>

        {/* Instructions Card */}
        <Card className="p-6 bg-muted">
          <h2 className="text-xl font-semibold mb-3">Setup Instructions</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Option 1: Replit Scheduled Deployment (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to Deployments → Create Scheduled Deployment</li>
                <li>Schedule: "Every hour"</li>
                <li>Cron: <code className="bg-background px-1 py-0.5 rounded">0 * * * *</code></li>
                <li>Run command: <code className="bg-background px-1 py-0.5 rounded">npx tsx scripts/ingest-feeds.ts</code></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Option 2: External Cron Service</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Use cron-job.org or similar service</li>
                <li>Set URL: <code className="bg-background px-1 py-0.5 rounded break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/cron/ingest</code></li>
                <li>Add header: <code className="bg-background px-1 py-0.5 rounded">Authorization: Bearer YOUR_CRON_SECRET</code></li>
                <li>Set CRON_SECRET environment variable in Replit</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
