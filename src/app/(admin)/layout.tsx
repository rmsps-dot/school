import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  /* ── Verify session ── */
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  /* ── Verify role is admin ── */
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div
      className="relative min-h-screen bg-ink"
    >
      <AdminSidebar adminName={profile.full_name ?? 'Admin'} adminAvatar={profile.profile_photo_url ?? null} />

      {/* Main content — offset for desktop sidebar, top-bar on mobile */}
      <main className="lg:ml-72 min-h-screen pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
