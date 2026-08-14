const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testTeacherAdminFlow() {
  // 1. Get a teacher profile ID
  const { data: teachers } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'teacher')
    .limit(1);
    
  if (!teachers || teachers.length === 0) {
    console.error("No teachers found");
    return;
  }
  
  const teacherId = teachers[0].id;
  console.log("Found teacher ID:", teacherId, teachers[0].full_name);
  
  // 2. Simulate what `getContactsForTeacher('admin')` does NOW
  // It uses supabaseAdmin and filters out the authenticated user's ID
  const tab = 'admin';
  const authProfileId = teacherId; // simulate teacher is logged in
  
  console.log("Simulating getContactsForTeacher('admin') for teacher", authProfileId);
  const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', tab === 'teachers' ? 'teacher' : 'admin')
        .eq('is_active', true)
        .neq('id', authProfileId)
        .order('full_name', { ascending: true });
        
  console.log("Result error:", error);
  console.log("Result data:", data);
  
  // 3. Check what TeacherChatClient does with this data
  const contacts = data || [];
  const searchQuery = '';
  const filteredContacts = contacts
    .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
  console.log("Filtered contacts on frontend:", filteredContacts);
}

testTeacherAdminFlow();
