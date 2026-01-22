'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
    { label: 'Signal Acquisition', progress: 50 },
    { label: 'Identity Analysis', progress: 75 },
    { label: 'Finalizing', progress: 100 },
  ];

  const renderStatusContent = () => {
    if (!jobStatus) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-[#D7FF3C] mb-4" />
          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Initializing Registry...</p>
        </div>
      );
    }

    if (jobStatus.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Registry Error</h3>
          <p className="text-zinc-500 text-sm mb-8">Verification encountered a protocol error.</p>
          <Button onClick={() => onOpenChange(false)} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 w-full h-11">Dismiss</Button>
        </div>
      );
    }

    if (jobStatus.result === 'approved') {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-20 h-20 bg-[#D7FF3C]/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#D7FF3C]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Access Granted</h3>
          <p className="text-zinc-500 text-sm mb-8">Identity successfully integrated into thecueRoom.</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#D7FF3C] text-black hover:bg-[#C5EA36] w-full font-bold h-12 text-base">Enter Dashboard</Button>
          <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">Transitioning in {autoRedirectSeconds}s</p>
        </div>
      );
    }

    return (
      <div className="py-6">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <Loader2 className="w-14 h-14 animate-spin text-[#D7FF3C]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#D7FF3C]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Identity Audit</h3>
          <p className="text-zinc-500 text-xs">Processing registry credentials...</p>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = jobStatus.progress >= step.progress;
            const isActive = jobStatus.progress < step.progress && (idx === 0 || jobStatus.progress >= steps[idx-1].progress);
            
            return (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isCompleted ? 'bg-[#D7FF3C]/5 border-[#D7FF3C]/20' : isActive ? 'bg-white/5 border-[#D7FF3C]/30' : 'bg-white/5 border-white/5'}`}>
                <div className="shrink-0">
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-[#D7FF3C]" /> : isActive ? <Loader2 className="w-5 h-5 animate-spin text-[#D7FF3C]" /> : <div className="w-5 h-5 rounded-full border border-white/10" />}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${isCompleted ? 'text-[#D7FF3C]' : isActive ? 'text-white' : 'text-zinc-600'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0B0B0B] border-white/10 p-8 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Registry Protocol</DialogTitle>
        </DialogHeader>
        {renderStatusContent()}
      </DialogContent>
    </Dialog>
  );
}
