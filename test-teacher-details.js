const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data: firstTeacher } = await supabase.from('teachers').select('profile_id').limit(1).single();
  if (!firstTeacher) {
    console.error("No teacher found");
    return;
  }
  
  const profileId = firstTeacher.profile_id;
  console.log("Testing with profile ID:", profileId);

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      profile_photo_url,
      dob,
      mobile,
      address,
      created_at,
      teachers (
        id,
        teacher_id,
        qualification,
        joining_date,
        teacher_classes ( subject, classes ( class_name, section ) ),
        teacher_attendance ( id, date, status, check_in_at, photo_url ),
        teacher_payments ( id, amount, month, payment_date, status, remarks )
      )
    `)
    .eq('id', profileId)
    .single();

  console.log("Error:", error);
  console.log("Data keys:", data ? Object.keys(data) : 'No data');
}

testQuery();
