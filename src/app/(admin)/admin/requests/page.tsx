import { supabaseAdmin } from '@/utils/supabase/admin'
import { fetchClasses } from '@/actions/admin-actions'
import RequestsClient from './RequestsClient'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  // Fetch pending registrations and classes in parallel
  const [
    { data: registrations, error },
    classes
  ] = await Promise.all([
    supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    fetchClasses()
  ])

  return (
    <RequestsClient
      initialRegistrations={registrations ?? []}
      classes={classes}
      fetchError={error?.message}
    />
  )
}
