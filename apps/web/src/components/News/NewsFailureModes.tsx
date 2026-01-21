'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Radio, UserCircle, Database, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <motion.div 
      initial={ { opacity: 0, scale: 0.98 } }
      animate={ { opacity: 1, scale: 1 } }
      className={cn(
        "flex flex-col items-center justify-center p-16 text-center min-h-[500px] border border-white/5 bg-[#111111] transition-all duration-700 relative overflow-hidden",
        glowColors[variant]
      )}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center mb-10 border transition-transform duration-500 hover:scale-110",
        accentColors[variant]
      )}>
        <Icon size={36} strokeWidth={1} />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-6 tracking-tighter uppercase font-mono">
        {title}
      </h3>
      
      <p className="text-gray-400 max-w-md mb-12 font-light leading-relaxed text-lg">
        {message}
      </p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="group flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.4em] px-10 py-4 border border-white/10 hover:border-[#D1FF3D] hover:text-[#D1FF3D] transition-all"
        >
          {action.label}
          <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
        </button>
      )}
    </motion.div>
  );
};

export const SignalLost = ({ onRetry }: { onRetry: () => void }) => (
  <SignalState 
    icon={WifiOff}
    title="Signal Interference"
    message="Sync sequence interrupted. The global node is currently unreachable. Re-establishing connection."
    variant="purple"
    action={{ label: "Retry Sync", onClick: onRetry }}
  />
);

export const SilenceInTheWire = () => (
  <SignalState 
    icon={Radio}
    title="Silence in the Wire"
    message="The underground frequency is currently quiet. No new intelligence strata detected."
    variant="gray"
  />
);

export const PartialSync = ({ onRetry }: { onRetry: () => void }) => (
  <SignalState 
    icon={Database}
    title="Partial Intelligence"
    message="We encountered encryption errors while fetching some data strata. The current feed may be incomplete."
    variant="lime"
    action={{ label: "Force Full Sync", onClick: onRetry }}
  />
);

export const AccessRestricted = ({ onLogin }: { onLogin: () => void }) => (
  <SignalState 
    icon={UserCircle}
    title="Identity Required"
    message="Deep intelligence nodes and underground frequencies are restricted to verified collective members."
    variant="lime"
    action={{ label: "Identify Yourself", onClick: onLogin }}
  />
);
