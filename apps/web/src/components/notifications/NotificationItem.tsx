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
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex gap-3 p-4 hover:bg-accent/50 cursor-pointer transition-colors
        ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
      `}
    >
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        {notification.title && (
          <h4 className={`text-sm font-semibold ${!notification.read ? 'font-bold' : ''}`}>
            {notification.title}
          </h4>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      {!notification.read && (
        <div className="absolute top-4 left-1 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </div>
  )
}
