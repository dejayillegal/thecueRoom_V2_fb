'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, Loader2, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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
  const shouldReduceMotion = useReducedMotion();
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

  const motionVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -20 },
  };

  const renderStatusContent = () => {
    if (!jobStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-lime-400 mb-4" />
          <p className="text-zinc-500 font-medium tracking-tight">INITIALIZING VERIFICATION...</p>
        </div>
      );
    }

    if (jobStatus.status === 'failed') {
      return (
        <motion.div
          variants={motionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Verification Error</h3>
          <p className="text-zinc-400 max-w-sm mb-8">
            Our security systems encountered an issue processing your request. Please contact support.
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-zinc-800 text-white hover:bg-zinc-700 w-full"
          >
            DISMISS
          </Button>
        </motion.div>
      );
    }

    if (jobStatus.result === 'verified_ai') {
      return (
        <motion.div
          variants={motionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="w-24 h-24 bg-lime-400/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(163,230,53,0.2)]">
            <ShieldCheck className="w-12 h-12 text-lime-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Integrity Verified</h3>
          <div className="bg-lime-400/10 border border-lime-400/20 rounded-full px-6 py-1.5 mb-6">
            <p className="text-lime-400 text-xs font-bold tracking-widest">
              CONFIDENCE SCORE: {jobStatus.score}%
            </p>
          </div>
          <p className="text-zinc-400 max-w-sm mb-8">
            Access granted. Welcome to thecueRoom, {jobStatus.notes || 'Artist'}.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-lime-400 text-black hover:bg-lime-500 w-full font-bold h-12 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
          >
            ENTER DASHBOARD <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase tracking-widest font-medium">
            Auto-transition in {autoRedirectSeconds}s
          </p>
        </motion.div>
      );
    }

    if (jobStatus.result === 'pending_admin') {
      return (
        <motion.div
          variants={motionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Escalated to Review</h3>
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase">
              Manual Authentication Required
            </p>
          </div>
          <p className="text-zinc-400 max-w-sm mb-8">
            Your credentials have been flagged for manual verification. This process typically takes 24 hours.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 w-full h-12"
          >
            CONTINUE AS RESTRICTED
          </Button>
        </motion.div>
      );
    }

    if (jobStatus.result === 'rejected_ai') {
      return (
        <motion.div
          variants={motionVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Verification Failed</h3>
          <p className="text-zinc-400 max-w-sm mb-6">
            {jobStatus.notes || "We couldn't verify your profile authenticity."}
          </p>
          <div className="flex gap-3 w-full">
            <Button
              onClick={() => router.push('/dashboard/settings')}
              className="flex-1 bg-lime-400 text-black hover:bg-lime-500 font-bold"
            >
              RETRY LINKS
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-zinc-900 text-white border border-zinc-800"
            >
              CLOSE
            </Button>
          </div>
        </motion.div>
      );
    }

    // Still processing
    return (
      <div className="py-8">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 animate-spin text-lime-400 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-lime-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight uppercase">Security Audit in Progress</h3>
          <p className="text-zinc-500 text-sm">Validating artist credentials via AI protocols...</p>
        </div>

        {/* Progress bar */}
        <div className="mb-10 px-4">
          <div className="bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${jobStatus.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-lime-400 h-full shadow-[0_0_15px_rgba(163,230,53,0.5)]"
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">AUDIT PROGRESS</span>
            <span className="text-[10px] text-lime-400 font-bold tracking-widest">{jobStatus.progress}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.progress);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                  status === 'completed'
                    ? 'bg-lime-400/5 border-lime-400/20'
                    : status === 'active'
                    ? 'bg-zinc-900 border-lime-400/30 shadow-[0_0_10px_rgba(163,230,53,0.05)]'
                    : 'bg-zinc-950/50 border-zinc-900'
                }`}
              >
                <div className="shrink-0">
                  {status === 'completed' ? (
                    <div className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3 text-black" />
                    </div>
                  ) : status === 'active' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-800" />
                  )}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${
                    status === 'completed'
                      ? 'text-lime-400'
                      : status === 'active'
                      ? 'text-white'
                      : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-black border-lime-400/20 shadow-[0_0_50px_rgba(163,230,53,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">AUTHENTICATION GATEWAY</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {renderStatusContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
