
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ShieldAlert,
  Save,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface IngestionConfig {
  id: string;
  enabled: boolean;
  intervalMinutes: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isRunning: boolean;
  lastError: string | null;
}

export default function IngestionAdminPage() {
  const [config, setConfig] = useState<IngestionConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ingestion-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setIsAdmin(true);
      } else if (res.status === 401 || res.status === 403) {
        // Try fetching as non-admin if possible, or just mark as non-admin
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Failed to fetch ingestion config:', error);
      toast.error('Failed to load ingestion configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<IngestionConfig>) => {
    if (!isAdmin || saving) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/ingestion-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          // Map local field name to API field name if needed
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        toast.success('Configuration updated successfully');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('A network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const forceRecalculate = () => {
    handleUpdate({ nextRunAt: new Date().toISOString() } as any);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Automated Ingestion</h1>
          <p className="text-muted-foreground mt-2">
            Manage the internal background scheduler for news feeds.
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium border border-yellow-500/20">
            <ShieldAlert className="w-3 h-3" />
            Read Only
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Quick Look */}
        <Card className="p-6 border-primary/10 bg-black/40 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Process State</span>
            <Activity className={`w-4 h-4 ${config.isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold">
              {config.isRunning ? 'Active' : 'Idle'}
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full ${config.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </Card>

        <Card className="p-6 border-primary/10 bg-black/40 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Last Run</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-xl font-semibold truncate">
            {config.lastRunAt ? new Date(config.lastRunAt).toLocaleTimeString() : 'Never'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {config.lastRunAt ? new Date(config.lastRunAt).toLocaleDateString() : 'N/A'}
          </div>
        </Card>

        <Card className="p-6 border-primary/10 bg-black/40 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Next Scheduled</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-semibold truncate">
            {config.nextRunAt ? new Date(config.nextRunAt).toLocaleTimeString() : 'Manual Only'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {config.nextRunAt ? new Date(config.nextRunAt).toLocaleDateString() : 'N/A'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Controls */}
          <Card className="p-8 border-primary/10 bg-black/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="ingestion-enabled" className="text-lg font-semibold">Enable Automated Ingestion</Label>
                  <p className="text-sm text-muted-foreground">When disabled, the background scheduler will pause all operations.</p>
                </div>
                <Switch 
                  id="ingestion-enabled"
                  checked={config.enabled}
                  disabled={!isAdmin || saving}
                  onCheckedChange={(checked) => handleUpdate({ enabled: checked })}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="interval" className="text-lg font-semibold">Ingestion Interval</Label>
                  <p className="text-sm text-muted-foreground">How often (in minutes) the system should check for new content.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-[200px]">
                    <Input
                      id="interval"
                      type="number"
                      min={5}
                      max={1440}
                      value={config.intervalMinutes}
                      disabled={!isAdmin || saving}
                      onChange={(e) => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) || 60 })}
                      className="pr-12 bg-black/40 border-primary/20 focus:border-primary transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                  </div>
                  <Button 
                    variant="outline"
                    className="border-primary/20 hover:border-primary/50"
                    disabled={!isAdmin || saving}
                    onClick={() => handleUpdate({ intervalMinutes: config.intervalMinutes })}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Valid range: 5 minutes to 24 hours (1440 min).
                </p>
              </div>

              <div className="pt-4 border-t border-primary/10 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Force Recalculation</h3>
                  <p className="text-xs text-muted-foreground">Reset the next run time to "Now" to trigger ingestion on the next cycle.</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  disabled={!isAdmin || saving || !config.enabled}
                  onClick={forceRecalculate}
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  Trigger Next Tick
                </Button>
              </div>
            </div>
          </Card>

          {/* Last Error Display */}
          {config.lastError && (
            <Card className="p-6 border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold text-destructive">Last Ingestion Error</h3>
                  <div className="p-3 rounded bg-black/40 text-xs font-mono text-destructive-foreground break-all border border-destructive/10">
                    {config.lastError}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-primary/10 bg-black/40 h-fit">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Scheduler Info
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-primary/5">
                <span className="text-muted-foreground">Architecture</span>
                <span className="font-medium">Internal Loop</span>
              </div>
              <div className="flex justify-between py-2 border-b border-primary/5">
                <span className="text-muted-foreground">Resolution</span>
                <span className="font-medium">60 Seconds</span>
              </div>
              <div className="flex justify-between py-2 border-b border-primary/5">
                <span className="text-muted-foreground">Locking</span>
                <span className="font-medium">Atomic DB Flag</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Failover</span>
                <span className="font-medium">Auto-retry</span>
              </div>
            </div>
          </Card>

          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              Note
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This system uses an internal Node process. Unlike external cron services, it relies on the server being active. If the server sleeps or restarts, the scheduler will automatically resume based on the database state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
