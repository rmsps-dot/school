import { createClient } from '@/utils/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

// No auth required — public page
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch only public notices using the standard (anon key) server client
  // RLS on notices table allows SELECT for target_role = 'all' without auth
  const supabase = await createClient()
  const { data: notices } = await supabase
    .from('notices')
    .select('title, content, created_at')
    .eq('target_role', 'all')
    .order('created_at', { ascending: false })
    .limit(10)

  // Graceful fallback: if DB fetch fails or returns empty, LandingPage
  // shows hardcoded placeholder notices internally
  return <LandingPage notices={notices ?? []} />
}
