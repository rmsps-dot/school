const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function testParents() {
  const classId = 'de0de263-2396-4db0-90ee-c5b62e49c716'; // assuming a valid class ID
  
  const { data: students, error: studErr } = await client
    .from('students')
    .select('student_id, id, profiles!students_profile_id_fkey(full_name)')
    //.eq('class_id', classId)
    .limit(2);
    
  console.log("Students:", JSON.stringify(students, null, 2));
  
  const studentIds = students.map(s => s.student_id);
  console.log("Student IDs (using s.student_id text):", studentIds);
  
  const { data: parentLinks, error: parentErr } = await client
    .from('parent_students')
    .select('parent_id, student_id')
    .in('student_id', studentIds);
    
  console.log("Parent Links Error:", parentErr);
  console.log("Parent Links Data:", parentLinks);
}

testParents();
