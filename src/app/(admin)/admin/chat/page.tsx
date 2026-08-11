import { MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import AdminChatClient from './AdminChatClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminChatPage() {
  const client = await createClient()
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-coral" /> System Chat
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Direct messaging with any user across the entire RMSPS platform.
        </p>
      </div>

      <AdminChatClient currentUserId={user.id} />
    </div>
  )
}
