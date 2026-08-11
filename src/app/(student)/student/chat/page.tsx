import { MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import StudentChatClient from './StudentChatClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentChatPage() {
  const client = await createClient()
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <MessageSquare className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            Messages
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            Connect securely with teachers and school administration.
          </p>
        </div>
      </div>

      <StudentChatClient currentUserId={user.id} />
    </div>
  )
}
