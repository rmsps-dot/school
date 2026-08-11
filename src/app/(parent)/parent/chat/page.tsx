import { MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import ParentChatClient from './ParentChatClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ParentChatPage() {
  const client = await createClient()
  
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-coral" /> Messages
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Connect securely with teachers and school administration.
        </p>
      </div>

      <ParentChatClient currentUserId={user.id} />
    </div>
  )
}
