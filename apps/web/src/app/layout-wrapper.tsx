"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main
        className={`pt-[72px] min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-[258px]" : "ml-0"}`}
      >
        <div className="container mx-auto px-6 py-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
