
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertCircle, Clock, X, Info } from 'lucide-react';
import { useToast } from '@/../../src/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationsPanel({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification_approved':
      case 'verification_success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'verification_pending':
      case 'verification_started':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'verification_denied':
      case 'verification_failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto bg-[#0f0f0f] border-[#1a1a1a] shadow-xl z-50">
          <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1a1a1a]">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                    !notification.read ? 'bg-[#1a1a1a]/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-gray-400 text-xs mt-1">
                        {notification.message}
                      </p>
                      <span className="text-gray-500 text-xs mt-2 block">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#D1FF3D] rounded-full" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
