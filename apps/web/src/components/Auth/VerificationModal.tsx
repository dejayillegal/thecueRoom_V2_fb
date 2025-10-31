'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Activity, X, Loader2 } from 'lucide-react';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  jobId: string;
}

interface VerificationStatus {
  status: 'pending' | 'processing' | 'verified' | 'failed' | 'manual_review';
  progress: number;
  message: string;
  details?: {
    signalScan: boolean;
    curatorCheck: boolean;
    accessUnlocked: boolean;
  };
}

export function VerificationModal({ open, onClose, userId, jobId }: VerificationModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'pending',
    progress: 0,
    message: 'Initializing verification...',
  });
  const [newsItems, setNewsItems] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !jobId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/verify/status/${jobId}`);
        const data = await res.json();
        
        const mappedStatus: VerificationStatus = {
          status: data.status === 'approved' ? 'verified' : 
                  data.status === 'review' ? 'manual_review' :
                  data.status === 'rejected' ? 'failed' :
                  data.status === 'processing' ? 'processing' : 'pending',
          progress: data.status === 'approved' ? 100 :
                   data.status === 'processing' ? 50 :
                   data.status === 'review' ? 75 :
                   data.status === 'rejected' ? 100 : 10,
          message: data.error || data.decision || 'Verifying your profile...',
          details: {
            signalScan: data.status !== 'queued',
            curatorCheck: data.status === 'approved' || data.status === 'rejected' || data.status === 'review',
            accessUnlocked: data.status === 'approved',
          },
        };
        
        setVerificationStatus(mappedStatus);

        if (data.status === 'approved') {
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    const fetchNews = async () => {
      try {
        const res = await fetch('/api/feeds?limit=3');
        const data = await res.json();
        if (data.data) {
          setNewsItems(data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
    };

    checkStatus();
    fetchNews();
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [open, jobId]);

  if (!open) return null;

  const isVerified = verificationStatus.status === 'verified';
  const isFailed = verificationStatus.status === 'failed';
  const isManualReview = verificationStatus.status === 'manual_review';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-[#0F0F0F] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close verification modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[1fr_380px]">
          <div className="p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Verification Submitted</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Auto-review in progress
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-sm font-semibold ${
                    verificationStatus.details?.signalScan 
                      ? 'border-green-500 bg-green-500/10 text-green-500' 
                      : 'border-[#333] bg-[#0B0B0B] text-muted-foreground'
                  }`}>
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Signal scan</h3>
                    <p className="text-sm text-muted-foreground">
                      Releases, engagement, and identity markers are evaluated.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-sm font-semibold ${
                    verificationStatus.details?.curatorCheck 
                      ? 'border-green-500 bg-green-500/10 text-green-500' 
                      : 'border-[#333] bg-[#0B0B0B] text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manual spot-check</h3>
                    <p className="text-sm text-muted-foreground">
                      A curator may glance over edge cases.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-sm font-semibold ${
                    verificationStatus.details?.accessUnlocked 
                      ? 'border-green-500 bg-green-500/10 text-green-500' 
                      : 'border-[#333] bg-[#0B0B0B] text-muted-foreground'
                  }`}>
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Access unlock</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll be notified and redirected to the dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0B0B] border border-[#262626] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Verification progress</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold capitalize">
                      {verificationStatus.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${verificationStatus.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {verificationStatus.details?.signalScan && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Signal scan complete
                      </span>
                    )}
                    {verificationStatus.details?.curatorCheck && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Curator spot-check passed
                      </span>
                    )}
                    {verificationStatus.details?.accessUnlocked && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Access unlocked
                      </span>
                    )}
                  </div>
                </div>

                {isVerified && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-green-500 mb-1">Verified</h4>
                        <p className="text-sm text-green-500/80">
                          Your profile is now verified. You can proceed to onboarding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isManualReview && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Loader2 className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0 animate-spin" />
                      <div>
                        <h4 className="font-semibold text-yellow-500 mb-1">Manual Review</h4>
                        <p className="text-sm text-yellow-500/80">
                          Your profile requires manual verification. A curator will review your account shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isFailed && (
                  <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-destructive mb-1">Verification Failed</h4>
                        <p className="text-sm text-destructive/80">
                          {verificationStatus.message || 'Unable to verify your profile automatically. Please contact support.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isVerified && (
              <div className="mt-8">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Goto Dashboard
                </Button>
              </div>
            )}
          </div>

          <div className="bg-[#0B0B0B] border-t md:border-t-0 md:border-l border-[#262626] p-6 md:p-8">
            <h3 className="text-base font-semibold mb-4">Curated News Rail</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Your feed tunes to Techno / Berlin while you wait.
            </p>

            <div className="space-y-4">
              {newsItems.length > 0 ? (
                newsItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.category || 'News'}</span>
                      <span>·</span>
                      <span>{item.readTime || '4 min read'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Berghain's late set chronicles</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Feature</span>
                      <span>·</span>
                      <span>7 min read</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">New modular wave in Detroit</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>News</span>
                      <span>·</span>
                      <span>4 min read</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Vinyl culture's 2AM return</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Editorial</span>
                      <span>·</span>
                      <span>6 min read</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#262626]">
              <h4 className="text-sm font-semibold mb-2">What's next?</h4>
              <p className="text-xs text-muted-foreground">
                Keep this window open. We'll pop onboarding as soon as you're verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
