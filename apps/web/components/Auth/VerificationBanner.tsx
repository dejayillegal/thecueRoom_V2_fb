
'use client';

import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface VerificationBannerProps {
  status: 'pending' | 'verified' | 'rejected' | 'processing';
  onRetry?: () => void;
}

export function VerificationBanner({ status, onRetry }: VerificationBannerProps) {
  const configs = {
    pending: {
      icon: Clock,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      textColor: 'text-yellow-400',
      title: 'Verification Pending',
      message: 'Your profile is being reviewed. This usually takes 24-48 hours.',
    },
    processing: {
      icon: RefreshCw,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-400',
      title: 'Verification in Progress',
      message: 'Our AI is analyzing your profile...',
    },
    verified: {
      icon: CheckCircle2,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      textColor: 'text-green-400',
      title: 'Profile Verified!',
      message: 'You now have full access to all artist features.',
    },
    rejected: {
      icon: AlertCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      textColor: 'text-red-400',
      title: 'Verification Failed',
      message: 'We couldn\'t verify your profile. Please update your information and try again.',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.textColor} ${status === 'processing' ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${config.textColor} mb-1`}>{config.title}</h3>
          <p className="text-sm text-gray-400">{config.message}</p>
        </div>
        {status === 'rejected' && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-sm bg-lime-400 text-black rounded hover:bg-lime-500"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
