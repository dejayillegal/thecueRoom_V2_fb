"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/../../src/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, status, ...props }: any) {
        const isPending = variant === 'pending' || status === 'pending'
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {title && <ToastTitle>{title}</ToastTitle>}
              </div>
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
