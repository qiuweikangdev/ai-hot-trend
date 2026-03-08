import { LoginPanel } from '@/components/auth/login-panel'

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#fff8ec_0%,#f6f9ff_45%,#eef8f6_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <LoginPanel />
      </main>
    </div>
  )
}
