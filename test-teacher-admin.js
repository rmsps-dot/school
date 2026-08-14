const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

// Create an admin client to get a teacher user ID first
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testTeacherToAdmin() {
  const { data: teachers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'teacher')
    .limit(1);
    
  if (!teachers || teachers.length === 0) {
    console.error("No teachers found");
    return;
  }
  
  const teacherId = teachers[0].id;
  console.log("Found teacher ID:", teacherId);
  
  // Create an authenticated client impersonating the teacher using JWT override or just check policies.
  // Actually, we can use the RLS directly via RPC or just query as the user if we login, but since we can't login without password, we can just look at policies.
  
  const { data: policies } = await supabaseAdmin
    .rpc('run_sql', { sql: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles'"});
    
  console.log("Policies for 'profiles' table:", policies);
}

testTeacherToAdmin();
