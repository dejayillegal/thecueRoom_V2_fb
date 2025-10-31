'use client';

import { useState, useCallback, memo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { User, Bell, Lock, Palette } from 'lucide-react';

const mockUser = {
  name: 'Artist',
  email: 'artist@example.com',
  image: null,
};

export default memo(function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <Header 
        user={mockUser}
        sidebarOpen={sidebarOpen}
      />
      <main 
        className="min-h-screen pt-[72px] ml-0 lg:ml-[60px] transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
      >
        <div className="px-6 py-6 max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">Manage your account preferences and settings</p>

          <div className="space-y-6">
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User size={20} />
                  Profile Settings
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Display Name</Label>
                  <Input 
                    id="name" 
                    defaultValue="Artist" 
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue="artist@example.com" 
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <Button className="bg-[var(--tcr-accent)] text-black hover:bg-[var(--tcr-accent)]/90 h-9 px-3 gap-1.5">
                  <span>Save Changes</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell size={20} />
                  Notifications
                </CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive news updates via email</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">New Feed Items</Label>
                    <p className="text-sm text-gray-500">Get notified of new content</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Forum Replies</Label>
                    <p className="text-sm text-gray-500">Notifications for forum discussions</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock size={20} />
                  Security
                </CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-gray-300">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <Button className="bg-[var(--tcr-accent)] text-black hover:bg-[var(--tcr-accent)]/90 h-9 px-3 gap-1.5">
                  <span>Update Password</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette size={20} />
                  Appearance
                </CardTitle>
                <CardDescription>Customize your dashboard appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Neon Theme</Label>
                    <p className="text-sm text-gray-500">Enable neon accent colors</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Compact Mode</Label>
                    <p className="text-sm text-gray-500">Reduce spacing for more content</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
});
