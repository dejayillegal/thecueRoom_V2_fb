
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostRegisterOnboardProps {
  open: boolean;
  jobId: string;
  onOpenChange: (open: boolean) => void;
}

interface JobStatus {
  jobId: string;
  status: string;
  decision?: string;
  score?: number;
  evidence?: any;
  error?: string;
  updatedAt: string;
}

export function PostRegisterOnboard({ open, jobId, onOpenChange }: PostRegisterOnboardProps) {
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!open || !jobId) return;

    let interval: NodeJS.Timeout;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/verify/status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          
          if (data.status === 'completed' || data.status === 'rejected' || data.status === 'failed') {
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
      setPollCount(c => c + 1);
    };

    pollStatus();
    
    if (isPolling) {
      // Poll every 2s initially, then backoff
      const delay = pollCount < 5 ? 2000 : pollCount < 10 ? 5000 : 10000;
      interval = setInterval(pollStatus, delay);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, jobId, isPolling, pollCount]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
    onOpenChange(false);
  };

  if (!open) return null;

  const isVerified = jobStatus?.decision === 'approved';
  const isRejected = jobStatus?.decision === 'rejected';
  const needsReview = jobStatus?.status === 'review';
  const isProcessing = jobStatus?.status === 'processing' || jobStatus?.status === 'queued';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md" />
      
      <div className="relative w-full max-w-[800px] bg-[#0F0F0F] border border-[#262626] rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {isVerified ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : isProcessing ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            )}
            <h2 className="text-2xl font-bold">
              {isVerified ? 'Verified!' : isRejected ? 'Verification Failed' : needsReview ? 'Manual Review' : 'Verification Submitted'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {isVerified ? 'Your profile is now verified. You can proceed to onboarding.' : 
             isProcessing ? 'Auto-review in progress' : 
             needsReview ? 'A curator may glance over edge cases.' : 
             'Verification process initiated'}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                jobStatus?.status !== 'queued' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'
              }`}>
                {jobStatus?.status !== 'queued' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <div>
                <h3 className="font-semibold">Signal scan</h3>
                <p className="text-xs text-muted-foreground">
                  Releases, engagement, and identity markers are evaluated.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                needsReview || isVerified || isRejected ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'
              }`}>
                {needsReview || isVerified || isRejected ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <div>
                <h3 className="font-semibold">Manual spot-check</h3>
                <p className="text-xs text-muted-foreground">
                  A curator may glance over edge cases.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'
              }`}>
                {isVerified ? <CheckCircle2 className="h-4 w-4" /> : '3'}
              </div>
              <div>
                <h3 className="font-semibold">Access unlock</h3>
                <p className="text-xs text-muted-foreground">
                  You'll be notified and redirected to the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {jobStatus?.evidence?.profileUrl && (
          <div className="mb-6 p-4 bg-[#0B0B0B] border border-[#262626] rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Submitted link</h4>
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

        {isProcessing && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-semibold">Verification progress</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: jobStatus?.status === 'processing' ? '75%' : '25%' }}
              />
            </div>
          </div>
        )}

        {isVerified && (
          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-500">Verified</h4>
                <p className="text-sm text-muted-foreground">
                  Your profile is now verified. You can proceed to onboarding.
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
                <h4 className="font-semibold text-yellow-500">Queued for manual review</h4>
                <p className="text-sm text-muted-foreground">
                  A curator will review within 24-72 hours. You'll receive an email notification.
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
                <h4 className="font-semibold text-destructive">Verification unsuccessful</h4>
                <p className="text-sm text-muted-foreground">
                  {jobStatus?.error || 'The submitted profile could not be verified. Please contact support.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isVerified && (
            <Button
              onClick={handleGoToDashboard}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          )}
          {!isVerified && (
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-[#262626] hover:bg-accent"
            >
              {needsReview || isRejected ? 'Close' : 'Keep Waiting'}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Keep this window open. We'll pop onboarding as soon as you're verified.
        </p>
      </div>
    </div>
  );
}
