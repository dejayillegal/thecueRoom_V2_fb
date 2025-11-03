
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "../../../components/ui/progress";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onComplete?: () => void;
}

interface VerificationJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  decision?: "verified" | "pending_admin" | "rejected";
  confidence?: number;
  progress?: number;
  metadata?: {
    progress?: string;
    reason?: string;
  };
}

const PROGRESS_STEPS = [
  { key: "queued", label: "Queued", value: 20 },
  { key: "fetching", label: "Fetching Profile", value: 40 },
  { key: "analyzing", label: "AI Verification", value: 60 },
  { key: "deciding", label: "Validating", value: 80 },
];

export default function VerificationModal({
  open,
  onOpenChange,
  jobId,
  onComplete,
}: VerificationModalProps) {
  const [job, setJob] = useState<VerificationJob | null>(null);
  const [progress, setProgress] = useState(20);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/verification/job/${jobId}`);
        const data = await response.json();

        if (data.ok && data.job) {
          setJob(data.job);

          // Update progress
          if (data.job.status === "queued") {
            setProgress(20);
          } else if (data.job.status === "processing") {
            const progressKey = data.job.metadata?.progress || "fetching";
            const step = PROGRESS_STEPS.find((s) => s.key === progressKey);
            setProgress(step?.value || 40);
          } else if (data.job.status === "completed") {
            setProgress(100);
            if (data.job.decision === "verified") {
              setTimeout(() => setAutoRedirectSeconds(3), 500);
            }
          }

          // Stop polling when complete
          if (data.job.status === "completed" || data.job.status === "failed") {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Failed to poll verification job:", error);
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

  const handleSignOut = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/";
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  const getStepStatus = (stepValue: number) => {
    if (progress >= stepValue) return "completed";
    if (progress >= stepValue - 20) return "active";
    return "pending";
  };

  const renderContent = () => {
    if (!job) {
      return (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-[#D7FF3C]" />
            <p className="text-white text-lg">Loading verification status...</p>
          </div>
        </div>
      );
    }

    // Verification Success
    if (job.status === "completed" && job.decision === "verified") {
      return (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-[#D7FF3C]/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#D7FF3C]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Verification Complete!</h3>
              <p className="text-gray-400">Your artist profile has been verified</p>
            </div>
          </div>
          
          <div className="bg-[#D7FF3C]/10 border border-[#D7FF3C]/20 rounded-lg p-4">
            <p className="text-[#D7FF3C] text-center font-medium">
              Redirecting to dashboard in {autoRedirectSeconds}s...
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={onComplete}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12 rounded-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    // Pending Admin Review
    if (job.status === "completed" && job.decision === "pending_admin") {
      return (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Clock className="h-12 w-12 text-yellow-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Manual Review Required</h3>
              <p className="text-gray-400">Your profile is being reviewed by our team</p>
            </div>
          </div>
          
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <p className="text-yellow-400 text-center text-sm">
              You'll receive a notification once the review is complete (usually 24-48 hours)
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={handleSignOut}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12 rounded-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    // Failed or Rejected
    if (job.status === "failed" || (job.status === "completed" && job.decision === "rejected")) {
      return (
        <div className="space-y-6 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Verification Failed</h3>
              <p className="text-gray-400">We couldn't verify your profile</p>
            </div>
          </div>
          
          {job.metadata?.reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-center text-sm">{job.metadata.reason}</p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button
              onClick={onComplete}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12 rounded-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // Processing/Queued state
    return (
      <div className="space-y-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-[#D7FF3C]" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">Verifying Your Profile</h3>
            <p className="text-gray-400 text-sm">This may take a few moments...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-gray-400">{progress}% Complete</p>
        </div>

        <div className="space-y-2">
          {PROGRESS_STEPS.map((step, idx) => {
            const status = getStepStatus(step.value);
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  status === 'completed'
                    ? 'bg-[#D7FF3C]/10 border border-[#D7FF3C]/20'
                    : status === 'active'
                    ? 'bg-yellow-400/10 border border-yellow-400/20'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a]'
                }`}
              >
                <div>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#D7FF3C]" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-700" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    status === 'completed'
                      ? 'text-[#D7FF3C]'
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

  const canClose = job?.status === "completed" || job?.status === "failed";

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md bg-black border border-[#2a2a2a] text-white p-8"
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-[#D7FF3C]">
            Profile Verification
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
