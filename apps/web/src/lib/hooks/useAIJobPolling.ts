import { useState, useEffect, useRef } from "react";

interface AIJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress?: number;
  resultUrl?: string;
  error?: string;
}

export function useAIJobPolling(jobId: string | null) {
  const [job, setJob] = useState<AIJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5s intervals

    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/job/${jobId}`);
        const data = await response.json();

        setJob(data);

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error("Job polling error:", error);
      }
    };

    poll(); // Initial poll
    intervalRef.current = setInterval(poll, 5000); // Poll every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId]);

  return { job, isPolling };
}
