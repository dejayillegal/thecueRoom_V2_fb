
import { Card } from '@/components/ui/card';
import { Bell, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function NotificationExamples() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold mb-4">Notification Examples</h2>
      
      {/* Success Notification */}
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">Profile Verified!</h4>
            <p className="text-gray-400 text-xs mt-1">
              Your artist profile has been verified. Welcome to thecueRoom!
            </p>
            <span className="text-gray-500 text-xs mt-2 block">Just now</span>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
      </Card>

      {/* Pending Notification */}
      <Card className="p-4 bg-yellow-400/10 border-yellow-400/20">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">Verification Started</h4>
            <p className="text-gray-400 text-xs mt-1">
              Your profile verification is in progress. This usually takes a few moments.
            </p>
            <span className="text-gray-500 text-xs mt-2 block">2 minutes ago</span>
          </div>
        </div>
      </Card>

      {/* Error Notification */}
      <Card className="p-4 bg-red-500/10 border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">Verification Failed</h4>
            <p className="text-gray-400 text-xs mt-1">
              We couldn't verify your profile. Please update your information and try again.
            </p>
            <span className="text-gray-500 text-xs mt-2 block">5 minutes ago</span>
          </div>
        </div>
      </Card>

      {/* Info Notification */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">New Feature Available</h4>
            <p className="text-gray-400 text-xs mt-1">
              Check out the new EPK generator in your dashboard!
            </p>
            <span className="text-gray-500 text-xs mt-2 block">1 hour ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
