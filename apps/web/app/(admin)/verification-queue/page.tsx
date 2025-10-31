
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, ExternalLink, Search } from 'lucide-react';

export default function VerificationQueuePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/verify/queue');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Load jobs error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    try {
      const res = await fetch(`/api/verify/accept/${jobId}`, {
        method: 'POST',
        headers: { 'x-admin': 'true' },
      });
      
      if (res.ok) {
        await loadJobs();
      }
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      const res = await fetch(`/api/verify/reject/${jobId}`, {
        method: 'POST',
        headers: { 'x-admin': 'true' },
      });
      
      if (res.ok) {
        await loadJobs();
      }
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter !== 'all' && job.status !== filter) return false;
    if (search && !job.profileUrl.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Verification Queue</h1>
        <p className="text-muted-foreground">Review and manage artist verification submissions</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="review">Needs Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No jobs found</p>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      job.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      job.status === 'review' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {job.status}
                    </span>
                    {job.decision && (
                      <span className="text-xs text-muted-foreground">
                        Decision: {job.decision}
                      </span>
                    )}
                    {job.score !== null && (
                      <span className="text-xs text-muted-foreground">
                        Score: {job.score}/100
                      </span>
                    )}
                  </div>

                  <a
                    href={job.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {job.profileUrl}
                  </a>

                  {job.evidence && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {job.evidence.signals && (
                        <>
                          {job.evidence.signals.foundAudio && <p>✓ Audio detected</p>}
                          {job.evidence.signals.foundReleases && <p>✓ Releases found</p>}
                          {job.evidence.signals.followerCount > 0 && (
                            <p>✓ {job.evidence.signals.followerCount} followers</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>

                {job.status === 'review' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500/20"
                      onClick={() => handleAccept(job.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/20"
                      onClick={() => handleReject(job.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
