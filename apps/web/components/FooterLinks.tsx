
'use client';
import React, { useState } from 'react';
import InfoModal from './InfoModal';

export default function FooterLinks() {
  const [modal, setModal] = useState<string | null>(null);

  const links = [
    { label: 'About', type: 'about' },
    { label: 'Privacy', type: 'privacy' },
    { label: 'Terms', type: 'terms' },
    { label: 'Contact', type: 'contact' },
  ];

  return (
    <>
      <footer className="w-full py-6 border-t border-[#1a1a1a] text-[12px] text-[#888] flex flex-wrap justify-center gap-6 bg-black/80 backdrop-blur-sm">
        {links.map(({ label, type }) => (
          <button
            key={label}
            onClick={() => setModal(type)}
            className="uppercase tracking-wide hover:text-[#D1FF3D] transition-all"
            aria-label={`Open ${label}`}
          >
            {label}
          </button>
        ))}
        <span className="text-[#555]">© {new Date().getFullYear()} thecueRoom</span>
      </footer>

      {modal && <InfoModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}
