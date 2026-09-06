import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import StudentSidebar from '@/components/student/StudentSidebar'
import { GlobalPushBanner } from '@/components/notifications/GlobalPushBanner'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')

  return (
    <div className="relative min-h-screen bg-ink">
      <StudentSidebar studentName={profile.full_name ?? 'Student'} studentAvatar={profile.profile_photo_url} />
      <main className="lg:ml-72 min-h-screen pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <GlobalPushBanner />
        {children}
      </main>
    </div>
  )
}
