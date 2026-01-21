'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * LANDING CLIENT LAYOUT
 * Handles motion animations that require client-side execution.
 * Preserves editorial hierarchy while fixing Server/Client component mismatches.
 */
export default function LandingClientLayout({ children }: { children: ReactNode }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 md:py-48 relative"
    >
      <div className="absolute -left-20 top-48 w-40 h-[1px] bg-[#D1FF3D]/20 hidden xl:block" />
      {children}
    </motion.section>
  );
}
