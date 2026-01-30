import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Shield, Home, MessageSquare, User, Settings, Music, LayoutDashboard } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
