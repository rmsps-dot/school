import { supabaseAdmin } from '@/utils/supabase/admin'
import { fetchClasses } from '@/actions/admin-actions'
import { getAdminProfileRequests } from '@/actions/profile-request-actions'
import RequestsClient from './RequestsClient'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  // Fetch pending registrations, classes, and profile change requests in parallel
  const [
    { data: registrations, error: regError },
    classes,
    { data: profileRequests, error: profError }
  ] = await Promise.all([
    supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    fetchClasses(),
    getAdminProfileRequests('all')
  ])

  return (
    <RequestsClient
      initialRegistrations={registrations ?? []}
      classes={classes}
      initialProfileRequests={profileRequests ?? []}
      fetchError={regError?.message || profError || undefined}
    />
  )
}
