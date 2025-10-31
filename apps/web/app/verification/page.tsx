
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface JobStatus {
  jobId: string;
  status: string;
  decision?: string;
  score?: number;
  evidence?: any;
  error?: string;
  updatedAt: string;
}

export default function VerificationStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setIsLoading(false);
      return;
    }

    const loadStatus = async () => {
      try {
        const res = await fetch(`/api/verify/status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
        } else {
          setError('Failed to load verification status');
        }
      } catch (err) {
        setError('An error occurred while loading status');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
    
    // Poll every 5 seconds if still processing
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const isVerified = jobStatus?.decision === 'approved';
  const isRejected = jobStatus?.decision === 'rejected';
  const needsReview = jobStatus?.decision === 'review';
  const isProcessing = jobStatus?.status === 'processing' || jobStatus?.status === 'queued';

  if (!jobId) {
    return (
      <div className="max-w-[800px] mx-auto p-6 mt-12">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Job ID</h1>
          <p className="text-muted-foreground mb-4">
            Please provide a job ID to check verification status.
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto p-6 mt-12">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading verification status...</p>
        </Card>
      </div>
    );
  }

  if (error || !jobStatus) {
    return (
      <div className="max-w-[800px] mx-auto p-6 mt-12">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto p-6 mt-12">
      <Card className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {isVerified ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : isProcessing ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            )}
            <h1 className="text-3xl font-bold">
              {isVerified ? 'Verified!' : isRejected ? 'Verification Failed' : needsReview ? 'Manual Review' : 'Verification in Progress'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isVerified ? 'Your profile has been verified successfully.' : 
             isProcessing ? 'Your verification is being processed...' : 
             needsReview ? 'Your submission requires manual review by a curator.' : 
             'Verification process initiated'}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-semibold">{jobStatus.status}</span>
            </div>
            {jobStatus.decision && (
              <div>
                <span className="text-muted-foreground">Decision:</span>
                <span className="ml-2 font-semibold">{jobStatus.decision}</span>
              </div>
            )}
            {jobStatus.score !== null && jobStatus.score !== undefined && (
              <div>
                <span className="text-muted-foreground">Score:</span>
                <span className="ml-2 font-semibold">{jobStatus.score}/100</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="ml-2 font-semibold">
                {new Date(jobStatus.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {jobStatus.evidence?.profileUrl && (
          <div className="mb-6 p-4 bg-[#0B0B0B] border border-[#262626] rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Submitted Profile</h3>
            <a 
              href={jobStatus.evidence.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {jobStatus.evidence.profileUrl}
            </a>
          </div>
        )}

        {jobStatus.evidence?.signals && (
          <div className="mb-6 p-4 bg-[#0B0B0B] border border-[#262626] rounded-lg">
            <h3 className="text-sm font-semibold mb-3">Verification Signals</h3>
            <div className="space-y-2 text-xs">
              {jobStatus.evidence.signals.foundAudio && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Audio content detected</span>
                </div>
              )}
              {jobStatus.evidence.signals.foundReleases && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Releases found</span>
                </div>
              )}
              {jobStatus.evidence.signals.followerCount > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{jobStatus.evidence.signals.followerCount} followers</span>
                </div>
              )}
              {jobStatus.evidence.signals.recentActivity && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Recent activity detected</span>
                </div>
              )}
            </div>
          </div>
        )}

        {isVerified && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-500">Verification Successful</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile has been verified. You now have full access to the platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {needsReview && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-500">Manual Review Required</h3>
                <p className="text-sm text-muted-foreground">
                  A curator will review your submission within 24-72 hours. You'll receive an email notification.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Verification Unsuccessful</h3>
                <p className="text-sm text-muted-foreground">
                  {jobStatus.error || 'The submitted profile could not be verified. Please contact support for assistance.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {jobStatus.error && !isRejected && (
          <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="text-sm text-muted-foreground">{jobStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isVerified && (
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          )}
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="flex-1 border-[#262626] hover:bg-accent"
          >
            Back to Home
          </Button>
        </div>

        {isProcessing && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            This page will automatically refresh as the status updates.
          </p>
        )}
      </Card>
    </div>
  );
}
