'use client';

import { cn } from '@/lib/utils';
import { WifiOff, Radio, UserCircle, Database } from 'lucide-react';

interface SignalStateProps {
  icon: React.ElementType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'lime' | 'purple' | 'gray';
}

const SignalState = ({ icon: Icon, title, message, action, variant = 'gray' }: SignalStateProps) => {
  const accentColors = {
    lime: 'text-[#D1FF3D] border-[#D1FF3D]/30 bg-[#D1FF3D]/5',
    purple: 'text-[#873BBF] border-[#873BBF]/30 bg-[#873BBF]/5',
    gray: 'text-gray-500 border-white/10 bg-white/5'
  };

  const glowColors = {
    lime: 'shadow-[0_0_50px_rgba(209,255,61,0.1)]',
    purple: 'shadow-[0_0_50px_rgba(135,59,191,0.1)]',
    gray: ''
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center min-h-[400px] border border-white/5 bg-[#111111] transition-all duration-700",
      glowColors[variant]
    )}>
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mb-8 border transition-transform duration-500 hover:scale-110",
        accentColors[variant]
      )}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4 tracking-tight uppercase font-mono">
        {title}
      </h3>
      
      <p className="text-gray-400 max-w-sm mb-10 font-light leading-relaxed">
        {message}
      </p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="font-mono text-[10px] uppercase tracking-[0.4em] px-8 py-3 border border-white/10 hover:border-[#D1FF3D] hover:text-[#D1FF3D] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const SignalLost = ({ onRetry }: { onRetry: () => void }) => (
  <SignalState 
    icon={WifiOff}
    title="Signal Lost"
    message="Connection to the intelligence stream was interrupted. Retrying sync sequence."
    variant="purple"
    action={{ label: "Reconnect", onClick: onRetry }}
  />
);

export const SilenceInTheWire = () => (
  <SignalState 
    icon={Radio}
    title="Silence in the Wire"
    message="No new signals detected in this frequency. The underground is currently quiet."
    variant="gray"
  />
);

export const PartialSync = ({ onRetry }: { onRetry: () => void }) => (
  <SignalState 
    icon={Database}
    title="Partial Sync"
    message="We encountered interference while fetching some data strata. The stream may be incomplete."
    variant="lime"
    action={{ label: "Retry Full Sync", onClick: onRetry }}
  />
);

export const AccessRestricted = ({ onLogin }: { onLogin: () => void }) => (
  <SignalState 
    icon={UserCircle}
    title="Identity Required"
    message="Deep intelligence and underground signals are reserved for verified collective members."
    variant="lime"
    action={{ label: "Identify Yourself", onClick: onLogin }}
  />
);
