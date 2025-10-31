'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  result: string | null;
  score?: number;
  notes?: string;
  evidence?: any;
}

export function VerificationModal({ open, onOpenChange, jobId }: VerificationModalProps) {
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(3);

  useEffect(() => {
    if (!open || !jobId) return;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/verification/job/${jobId}`);
        const data = await res.json();
        setJobStatus(data);

        // Stop polling if job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };

    pollJob();
    
    if (isPolling) {
      const interval = setInterval(pollJob, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId, open, isPolling]);

  // Auto-redirect countdown for verified users
  useEffect(() => {
    if (!jobStatus || jobStatus.result !== 'verified_ai') return;

    const timer = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jobStatus, router]);

  const getStepStatus = (stepProgress: number) => {
    if (!jobStatus) return 'pending';
    if (jobStatus.progress >= stepProgress) return 'completed';
    if (jobStatus.progress >= stepProgress - 20) return 'active';
    return 'pending';
  };

  const steps = [
    { label: 'Queued', progress: 10 },
    { label: 'Fetching Links', progress: 50 },
    { label: 'Analyzing Signals', progress: 70 },
    { label: 'AI Decision', progress: 90 },
    { label: 'Complete', progress: 100 },
  ];

  const renderStatusContent = () => {
    if (!jobStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-lime-400 mb-4" />
          <p className="text-gray-400">Loading verification status...</p>
        </div>
      );
    }

    if (jobStatus.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
          <p className="text-gray-400 text-center mb-4">
            There was an error processing your verification. Please try again later.
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      );
    }

    if (jobStatus.result === 'verified_ai') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="w-16 h-16 text-lime-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Profile Verified!</h3>
          <div className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-4 mb-4">
            <p className="text-lime-400 font-semibold text-center">
              Confidence Score: {jobStatus.score}/100
            </p>
          </div>
          <p className="text-gray-400 text-center mb-4">
            Welcome to thecueRoom! You now have full access to all features.
          </p>
          {jobStatus.notes && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-sm text-gray-300 text-center">{jobStatus.notes}</p>
            </div>
          )}
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-lime-400 text-black hover:bg-lime-500"
          >
            Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Auto-redirecting in {autoRedirectSeconds}s...
          </p>
        </div>
      );
    }

    if (jobStatus.result === 'pending_admin') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Clock className="w-16 h-16 text-yellow-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Verification Pending</h3>
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-4">
            <p className="text-yellow-400 font-semibold text-center">
              Manual Review Required
            </p>
          </div>
          <p className="text-gray-400 text-center mb-4 max-w-md">
            Your profile is being reviewed by our team. You'll receive a notification once the review is complete.
          </p>
          {jobStatus.notes && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-sm text-gray-300">{jobStatus.notes}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-4">
            This usually takes 24-48 hours. We've sent a notification to the admin team.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Continue to Dashboard
          </Button>
        </div>
      );
    }

    if (jobStatus.result === 'rejected_ai') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Verification Update</h3>
          <p className="text-gray-400 text-center mb-4 max-w-md">
            We couldn't automatically verify your profile with the provided information.
          </p>
          {jobStatus.notes && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-sm text-red-300">{jobStatus.notes}</p>
            </div>
          )}
          <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
            Please update your social links and try again, or contact support for assistance.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard/settings')}
              className="bg-lime-400 text-black hover:bg-lime-500"
            >
              Update Profile
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      );
    }

    // Still processing
    return (
      <div className="py-8">
        <div className="flex flex-col items-center mb-8">
          <Loader2 className="w-12 h-12 animate-spin text-lime-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Verifying Your Profile</h3>
          <p className="text-gray-400">This may take a few moments...</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-lime-400 h-full transition-all duration-500"
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {jobStatus.progress}% Complete
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.progress);
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  status === 'completed'
                    ? 'bg-lime-400/10 border border-lime-400/20'
                    : status === 'active'
                    ? 'bg-yellow-400/10 border border-yellow-400/20'
                    : 'bg-gray-900 border border-gray-800'
                }`}
              >
                <div>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-lime-400" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-700" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    status === 'completed'
                      ? 'text-lime-400'
                      : status === 'active'
                      ? 'text-yellow-400'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-black border-lime-400/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-lime-400">Profile Verification</DialogTitle>
        </DialogHeader>
        {renderStatusContent()}
      </DialogContent>
    </Dialog>
  );
}
