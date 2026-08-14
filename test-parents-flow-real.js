const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function testParentsFlow() {
  console.log("1. Fetching all students...");
  const { data: students, error: studErr } = await client
    .from('students')
    .select('id, student_id, profiles!students_profile_id_fkey(full_name)');
    
  if (studErr) {
    console.error("Student error:", studErr);
    return;
  }
  
  if (!students || students.length === 0) {
    console.log("No students found");
    return;
  }
  
  console.log("Students found:", students.length);
  
  const studentUuids = students.map(s => s.id);
  
  console.log("2. Fetching parent_students links...");
  const { data: parentLinks, error: parentErr } = await client
    .from('parent_students')
    .select('parent_id, student_id')
    .in('student_id', studentUuids);
    
  if (parentErr) {
    console.error("Parent links error:", parentErr);
    return;
  }
  
  console.log("Parent Links found:", parentLinks?.length || 0, parentLinks);
  
  if (!parentLinks || parentLinks.length === 0) {
    console.log("No parent links found for these students");
    return;
  }
  
  const parentIds = [...new Set(parentLinks.map(p => p.parent_id))];
  
  console.log("3. Fetching parent profiles...", parentIds);
  const { data: parents, error: profileErr } = await client
    .from('parents')
    .select('id, profile_id, profiles!parents_profile_id_fkey(full_name, role)')
    .in('id', parentIds);
    
  if (profileErr) {
    console.error("Profile error:", profileErr);
    return;
  }
  
  console.log("Parents found:", parents?.length || 0, parents);
}

testParentsFlow();
