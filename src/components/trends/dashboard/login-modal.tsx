'use client'

import { LoginPanel } from '@/components/auth/login-panel'

interface LoginModalProps {
  isOpen: boolean
  isSignedIn: boolean
  onClose: () => void
}

export function LoginModal({
  isOpen,
  isSignedIn,
  onClose,
}: LoginModalProps) {
  if (!isOpen || isSignedIn) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md" onClick={event => event.stopPropagation()}>
        <LoginPanel />
      </div>
    </div>
  )
}
