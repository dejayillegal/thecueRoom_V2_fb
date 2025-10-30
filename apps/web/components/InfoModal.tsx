
'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import InfoContent from './InfoContent';

export default function InfoModal({ type, onClose }: { type: string; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl max-w-2xl w-full mx-6 max-h-[85vh] overflow-y-auto text-white shadow-[0_0_25px_rgba(209,255,61,0.05)]"
      >
        <header className="flex justify-between items-center px-6 py-4 border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a] z-10">
          <h2 id="modal-title" className="text-[15px] font-semibold uppercase tracking-wide text-[#D1FF3D]">
            {type === 'about' ? 'About thecueRoom' : type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#999] hover:text-[#D1FF3D] transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-6 text-[13px] leading-relaxed text-[#ccc] space-y-4">
          <InfoContent type={type} />
        </div>
      </div>
    </div>
  );
}
