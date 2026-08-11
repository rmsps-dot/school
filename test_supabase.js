const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      profiles (*),
      parent_students (
        students (
          id, student_id,
          profiles (full_name, avatar_url, mobile),
          classes (class_name, section)
        )
      )
    `)
    .limit(1)
    .single();
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
