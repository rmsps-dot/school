const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, profile_photo_url');
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No profiles found.");
  } else {
    console.log(`Found ${data.length} profiles.`);
    data.forEach(p => {
      console.log(`Role: ${p.role}, Name: ${p.full_name}, Photo URL: ${p.profile_photo_url}`);
    });
  }
}
run();
