import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { X, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/../../packages/shared/notificationSchemas"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  default: Bell,
}

const typeColors = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  default: "text-gray-500",
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || typeIcons.default
  const iconColor = typeColors[notification.type as keyof typeof typeColors] || typeColors.default
  
  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    // Navigate to link if available
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex gap-2 p-3 hover:bg-white/5 cursor-pointer transition-colors
        ${!notification.read ? 'bg-blue-500/10' : ''}
      `}
    >
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        {notification.title && (
          <h4 className={`text-xs font-semibold ${!notification.read ? 'font-bold' : ''}`}>
            {notification.title}
          </h4>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
        >
          <X className="h-2.5 w-2.5" />
        </Button>
      )}
      
      {!notification.read && (
        <div className="absolute top-3 left-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
      )}
    </div>
  )
}
