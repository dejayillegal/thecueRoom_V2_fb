
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { CheckCircle2, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onComplete?: () => void;
}

interface VerificationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  decision?: 'verified' | 'pending_admin' | 'rejected';
  confidence?: number;
  progress?: number;
  metadata?: {
    progress?: string;
    reason?: string;
  };
}

const PROGRESS_STEPS = [
  { key: 'queued', label: 'Queued', value: 20 },
  { key: 'fetching', label: 'Fetching Links', value: 40 },
  { key: 'analyzing', label: 'Analyzing', value: 60 },
  { key: 'deciding', label: 'Decision', value: 80 }
];

export default function VerificationModal({ open, onOpenChange, jobId, onComplete }: VerificationModalProps) {
  const [job, setJob] = useState<VerificationJob | null>(null);
  const [progress, setProgress] = useState(20);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(null);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/verification/job/${jobId}`);
        const data = await response.json();

        if (data.ok && data.job) {
          setJob(data.job);

          // Update progress
          if (data.job.status === 'queued') {
            setProgress(20);
          } else if (data.job.status === 'processing') {
            const progressKey = data.job.metadata?.progress || 'fetching';
            const step = PROGRESS_STEPS.find(s => s.key === progressKey);
            setProgress(step?.value || 40);
          } else if (data.job.status === 'completed') {
            setProgress(100);
            if (data.job.decision === 'verified') {
              setTimeout(() => setAutoRedirectSeconds(2), 500);
            }
          }

          // Stop polling when complete
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Failed to poll verification job:', error);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  // Auto-redirect countdown
  useEffect(() => {
    if (autoRedirectSeconds !== null && autoRedirectSeconds > 0) {
      const timer = setTimeout(() => {
        setAutoRedirectSeconds(autoRedirectSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirectSeconds === 0) {
      onComplete?.();
    }
  }, [autoRedirectSeconds, onComplete]);

  const renderContent = () => {
    if (!job) {
      return (
        <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-[#D7FF3C] mb-4" />
          <p className="text-gray-400">Loading verification status...</p>
        </div>
      );
    }

    if (job.status === 'failed') {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/50 rounded-lg" role="alert">
          <div className="flex items-start gap-4">
            <XCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">Verification Failed</h3>
              <p className="text-gray-300 mb-4">
                We encountered an error during verification. Please try again or contact support.
              </p>
              <Button onClick={onComplete} className="bg-red-500 hover:bg-red-600 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (job.status === 'completed' && job.decision === 'verified') {
      return (
        <div className="p-6 bg-green-950/20 border border-green-500/50 rounded-lg" role="status" aria-live="polite">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 flex-shrink-0 animate-pulse" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-400 mb-2">✅ Verified!</h3>
              <p className="text-gray-300 mb-4">
                Congratulations! Your account has been verified. You now have full access to thecueRoom.
              </p>
              {job.confidence && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400">Confidence Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={job.confidence} className="flex-1" />
                    <span className="text-sm font-semibold text-green-400">{job.confidence}%</span>
                  </div>
                </div>
              )}
              {autoRedirectSeconds !== null && (
                <p className="text-sm text-gray-400 mb-4" aria-live="polite">
                  Redirecting to dashboard in {autoRedirectSeconds} seconds...
                </p>
              )}
              <Button onClick={onComplete} className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (job.status === 'completed' && job.decision === 'pending_admin') {
      return (
        <div className="p-6 bg-yellow-950/20 border border-yellow-500/50 rounded-lg" role="status" aria-live="polite">
          <div className="flex items-start gap-4">
            <Clock className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">Manual Review Required</h3>
              <p className="text-gray-300 mb-4">
                Your account is pending admin approval. We've notified our team and they'll review your profile shortly.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                You'll receive an email notification once your account has been reviewed. This typically takes 24-48 hours.
              </p>
              <Button onClick={onComplete} variant="outline" className="border-yellow-500/50 text-yellow-400">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View Status
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (job.status === 'completed' && job.decision === 'rejected') {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/50 rounded-lg" role="alert">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">Verification Unsuccessful</h3>
              <p className="text-gray-300 mb-4">
                We couldn't verify your account with the information provided.
              </p>
              {job.metadata?.reason && (
                <div className="mb-4 p-3 bg-red-950/30 rounded border border-red-500/30">
                  <p className="text-sm font-semibold text-red-300 mb-1">Reason:</p>
                  <p className="text-sm text-gray-300">{job.metadata.reason}</p>
                </div>
              )}
              <Button onClick={onComplete} className="bg-red-500 hover:bg-red-600 text-white">
                <AlertCircle className="mr-2 h-4 w-4" />
                Edit Links & Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Processing state
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#D7FF3C] mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-white mb-2">Verifying Your Account</h3>
          <p className="text-gray-400">Please wait while we verify your information...</p>
        </div>

        <div className="space-y-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-[#D7FF3C] font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3" aria-live="polite">
          {PROGRESS_STEPS.map((step, index) => {
            const isComplete = progress >= step.value;
            const isCurrent = progress < step.value && (index === 0 || progress >= PROGRESS_STEPS[index - 1].value);

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Complete" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-[#D7FF3C] animate-spin" aria-label="In progress" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" aria-label="Pending" />
                )}
                <span className={`text-sm ${isComplete ? 'text-green-400' : isCurrent ? 'text-[#D7FF3C]' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canClose = job?.status === 'completed' || job?.status === 'failed';

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl bg-[#0B0B0B] border-[#1a1a1a] text-white"
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#D7FF3C]">Account Verification</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
