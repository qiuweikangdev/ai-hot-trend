'use client'

import { Loader2 } from 'lucide-react'
import { LoginPanel } from '@/components/auth/login-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginModalProps {
  isOpen: boolean
  isSignedIn: boolean
  isSessionPending: boolean
  onClose: () => void
}

export function LoginModal({
  isOpen,
  isSignedIn,
  isSessionPending,
  onClose,
}: LoginModalProps) {
  if (!isOpen || isSignedIn) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm dark:bg-black/55" onClick={onClose}>
      <div className="w-full max-w-md" onClick={event => event.stopPropagation()}>
        {isSessionPending
          ? (
              // Reuse the page-level session state so reopening the modal
              // does not start another auth status request.
              <Card className="border-white/60 bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-md dark:border-border dark:bg-card dark:shadow-black/60">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">登录中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    正在检查会话
                  </div>
                </CardContent>
              </Card>
            )
          : (
              <LoginPanel />
            )}
      </div>
    </div>
  )
}
