import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/auth'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('genomic_session')?.value

  if (!token) {
    const headersList = await headers()
    const path = headersList.get('x-invoke-path') ?? '/dashboard'
    redirect(`/login?redirect=${encodeURIComponent(path)}`)
  }

  const payload = await verifyJwt(token)
  if (!payload) {
    const headersList = await headers()
    const path = headersList.get('x-invoke-path') ?? '/dashboard'
    redirect(`/login?redirect=${encodeURIComponent(path)}`)
  }

  return <DashboardShell>{children}</DashboardShell>
}
