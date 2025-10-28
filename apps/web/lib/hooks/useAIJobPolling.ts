'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIJobResponse, AIJobStatus } from '../schemas/ai';

interface UseAIJobPollingOptions {
  jobId: string | null;
  enabled?: boolean;
  maxRetries?: number;
  initialInterval?: number;
  maxInterval?: number;
}

interface UseAIJobPollingResult {
  status: AIJobStatus | null;
  resultUrl: string | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useAIJobPolling({
  jobId,
  enabled = true,
  maxRetries = 20,
  initialInterval = 1000,
  maxInterval = 30000,
}: UseAIJobPollingOptions): UseAIJobPollingResult {
  const [status, setStatus] = useState<AIJobStatus | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId || !enabled) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/ai/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.statusText}`);
      }

      const data: AIJobResponse = await response.json();

      if (!isMountedRef.current) return;

      setStatus(data.status);
      setResultUrl(data.resultUrl || null);
      setError(data.error || null);

      if (data.status === 'completed' || data.status === 'failed') {
        setIsLoading(false);
        return;
      }

      if (retryCount >= maxRetries) {
        setError('Polling timeout: Maximum retries reached');
        setIsLoading(false);
        return;
      }

      const nextInterval = Math.min(
        initialInterval * Math.pow(1.5, retryCount),
        maxInterval
      );

      timeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, nextInterval);

    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [jobId, enabled, retryCount, maxRetries, initialInterval, maxInterval]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (jobId && enabled) {
      fetchJobStatus();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [jobId, enabled, retryCount, fetchJobStatus]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    setError(null);
    fetchJobStatus();
  }, [fetchJobStatus]);

  return {
    status,
    resultUrl,
    error,
    isLoading,
    refetch,
  };
}
