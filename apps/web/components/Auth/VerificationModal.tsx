'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, Loader2, X } from 'lucide-react';
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
}

export function VerificationModal({ open, onOpenChange, jobId }: VerificationModalProps) {
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(3);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open || !jobId) return;

    const pollJob = async () => {
      try {
        const res = await fetch(`/api/verification/job/${jobId}`);
        const data = await res.json();
        setJobStatus(data);

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

  useEffect(() => {
    if (!jobStatus || jobStatus.result !== 'approved') return;

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

  const steps = [
    { label: 'Registry Check', progress: 10 },
    { label: 'Source Verification', progress: 50 },
    { label: 'Identity Analysis', progress: 75 },
    { label: 'Validation', progress: 100 },
  ];

  const motionProps = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  const renderStatusContent = () => {
    if (!jobStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#D1FF3D] mb-6 opacity-80" />
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em]">Initializing Registry...</p>
        </div>
      );
    }

    if (jobStatus.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 bg-red-500/5 border border-red-500/10 rounded-none flex items-center justify-center mb-8">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Audit Failed</h3>
          <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest mb-10">Verification protocol encountered an error</p>
          <Button onClick={() => onOpenChange(false)} className="bg-[#111111] border border-white/5 text-white hover:bg-white hover:text-black w-full h-14 rounded-none transition-all duration-300 uppercase tracking-widest text-[10px] font-bold">Dismiss</Button>
        </div>
      );
    }

    if (jobStatus.result === 'approved') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-[#D1FF3D]/10 border border-[#D1FF3D]/20 rounded-none flex items-center justify-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-[#D1FF3D]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">Access Granted</h3>
          <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest mb-10">Identity integrated successfully</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#D1FF3D] text-black hover:bg-white w-full font-bold h-16 rounded-none transition-all duration-300 uppercase tracking-[0.4em] text-[10px]">Enter Dashboard</Button>
          <p className="text-[9px] text-zinc-700 mt-6 uppercase tracking-[0.3em] font-mono">Transitioning in {autoRedirectSeconds}s</p>
        </div>
      );
    }

    return (
      <div className="py-8">
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-8">
            <Loader2 className="w-12 h-12 animate-spin text-[#D1FF3D]/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D1FF3D]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em] mb-2">Audit Status</h3>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">Processing Registry Data...</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = jobStatus.progress >= step.progress;
            const isActive = jobStatus.progress < step.progress && (idx === 0 || jobStatus.progress >= steps[idx-1].progress);
            
            return (
              <div key={idx} className={`flex items-center gap-5 p-5 rounded-none border transition-all duration-300 ${isCompleted ? 'bg-[#D1FF3D]/5 border-[#D1FF3D]/20' : isActive ? 'bg-[#111111] border-[#D1FF3D]/30' : 'bg-[#111111] border-white/5'}`}>
                <div className="shrink-0">
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#D1FF3D]" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin text-[#D1FF3D]" /> : <div className="w-4 h-4 rounded-none border border-white/5" />}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.3em] ${isCompleted ? 'text-[#D1FF3D]' : isActive ? 'text-white' : 'text-zinc-700'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0B0B0B] border-white/10 p-10 shadow-2xl rounded-none ring-0 focus:ring-0">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 text-zinc-600 hover:text-white transition-colors z-50"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <motion.div {...motionProps}>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] font-mono">Registry Protocol</DialogTitle>
            <DialogDescription className="sr-only">Verification progress for user identity registry</DialogDescription>
          </DialogHeader>
          {renderStatusContent()}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
