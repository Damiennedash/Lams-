import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = { title: 'LAMS Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#F0EDE8]">
      <AdminSidebar />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pt-14 md:pt-0">{children}</div>
      </div>
    </div>
  )
}
