import { MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import TeacherChatClient from './TeacherChatClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TeacherChatPage() {
  const client = await createClient()
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all classes for the dropdown
  const { data: classes } = await client
    .from('classes')
    .select('id, class_name, section')
    .order('class_name', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-coral" /> Messages
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Real-time communication with teachers, students, parents, and admin.
        </p>
      </div>

      <TeacherChatClient currentUserId={user.id} schoolClasses={classes || []} />
    </div>
  )
}
