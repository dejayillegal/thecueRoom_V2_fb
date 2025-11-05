import * as React from "react"
import { NotificationsPanel } from "./NotificationsPanel"
import type { Notification } from "@/../../packages/shared/notificationSchemas"

interface NotificationsButtonProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  onClearAll?: () => void
  onOpenSettings?: () => void
  isLoading?: boolean
}

export function NotificationsButton({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onOpenSettings,
  isLoading = false,
}: NotificationsButtonProps) {
  return (
    <NotificationsPanel
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={onMarkAsRead}
      onMarkAllAsRead={onMarkAllAsRead}
      onDelete={onDelete}
      onClearAll={onClearAll}
      onOpenSettings={onOpenSettings}
      isLoading={isLoading}
    />
  )
}
