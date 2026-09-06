import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'
import { LoginPushModal } from '@/components/notifications/LoginPushModal'
import { TopBarPushNotification } from '@/components/notifications/TopBarPushNotification'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  return (
    <div className="relative min-h-screen bg-ink">
      <TeacherSidebar teacherName={profile.full_name ?? 'Teacher'} teacherAvatar={profile.profile_photo_url ?? null} />
      <main className="lg:ml-72 min-h-screen pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="hidden lg:flex items-center justify-end mb-3">
          <TopBarPushNotification variant="desktop" />
        </div>
        <LoginPushModal />
        {children}
      </main>
    </div>
  )
}
