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
              setTimeout(() => setAutoRedirectSeconds(2), 500);
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
    // Clear any auth tokens/session
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/";
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  const renderContent = () => {
    if (!job) {
      return (
        <div className="space-y-8">
          <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-[#D7FF3C] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-lg">Loading verification status...</p>
            </div>
          </div>
        </div>
      );
    }

    // Verification Success
    if (job.status === "completed" && job.decision === "verified") {
      return (
        <div className="space-y-8">
          <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] border border-[#D7FF3C]/30 rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-[#D7FF3C] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-lg">Your artist profile is verified. Redirecting to dashboard...</p>
            </div>
          </div>
          
          <p className="text-gray-400 text-base">
            If you are not redirected automatically, continue below.
          </p>

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="bg-transparent border-[#D7FF3C] text-[#D7FF3C] hover:bg-[#D7FF3C]/10 px-8 h-12"
            >
              Back
            </Button>
            <Button
              onClick={onComplete}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12"
            >
              Open Dashboard
            </Button>
          </div>
        </div>
      );
    }

    // Pending Admin Review
    if (job.status === "completed" && job.decision === "pending_admin") {
      return (
        <div className="space-y-8">
          <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-[#D7FF3C] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-lg">Checking your credentials and artist verification...</p>
            </div>
          </div>
          
          <p className="text-gray-400 text-base">
            Access to dashboard is gated until approval. We'll notify you in under a minute.
          </p>

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="bg-transparent border-[#D7FF3C] text-[#D7FF3C] hover:bg-[#D7FF3C]/10 px-8 h-12"
            >
              Back
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12"
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
        <div className="space-y-8">
          <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] border border-red-500/30 rounded-lg">
            <XCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-lg">Verification failed. Please check your credentials and try again.</p>
              {job.metadata?.reason && (
                <p className="text-gray-400 text-sm mt-2">{job.metadata.reason}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="bg-transparent border-[#D7FF3C] text-[#D7FF3C] hover:bg-[#D7FF3C]/10 px-8 h-12"
            >
              Back
            </Button>
            <Button
              onClick={onComplete}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // Processing/Queued state - Verification Pending
    return (
      <div className="space-y-8">
        <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-[#D7FF3C] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white text-lg">Checking your credentials and artist verification...</p>
          </div>
        </div>
        
        <p className="text-gray-400 text-base">
          Access to dashboard is gated until approval. We'll notify you in under a minute.
        </p>

        <div className="flex justify-end gap-4">
          <Button
            onClick={handleBack}
            variant="outline"
            className="bg-transparent border-[#D7FF3C] text-[#D7FF3C] hover:bg-[#D7FF3C]/10 px-8 h-12"
          >
            Back
          </Button>
          <Button
            onClick={handleSignOut}
            className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold px-8 h-12"
          >
            Sign Out
          </Button>
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

  const getTitle = () => {
    if (job?.status === "completed" && job.decision === "verified") {
      return "Verification Success";
    }
    return "Verification Pending";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl bg-[#0B0B0B] border-[#1a1a1a] text-white"
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#D7FF3C]">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
