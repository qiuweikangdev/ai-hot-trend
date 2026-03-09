import { Suspense } from 'react'
import { LoginPanel } from '@/components/auth/login-panel'

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#fff8ec_0%,#f6f9ff_45%,#eef8f6_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <Suspense
          fallback={(
            <div className="w-full rounded-2xl border border-white/60 bg-white/90 p-6 text-sm text-muted-foreground shadow-xl shadow-amber-900/10 backdrop-blur-md">
              正在加载登录信息...
            </div>
          )}
        >
          <LoginPanel />
        </Suspense>
      </main>
    </div>
  )
}
