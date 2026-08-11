import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const classesToInsert = [
  { class_name: 'Nursery', section: 'A' },
  { class_name: 'LKG', section: 'A' },
  { class_name: 'UKG', section: 'A' },
  { class_name: 'Class 1', section: 'A' }, { class_name: 'Class 1', section: 'B' },
  { class_name: 'Class 2', section: 'A' }, { class_name: 'Class 2', section: 'B' },
  { class_name: 'Class 3', section: 'A' }, { class_name: 'Class 3', section: 'B' },
  { class_name: 'Class 4', section: 'A' }, { class_name: 'Class 4', section: 'B' },
  { class_name: 'Class 5', section: 'A' }, { class_name: 'Class 5', section: 'B' },
  { class_name: 'Class 6', section: 'A' }, { class_name: 'Class 6', section: 'B' },
  { class_name: 'Class 7', section: 'A' }, { class_name: 'Class 7', section: 'B' },
  { class_name: 'Class 8', section: 'A' }, { class_name: 'Class 8', section: 'B' },
  { class_name: 'Class 9', section: 'A' }, { class_name: 'Class 9', section: 'B' },
  { class_name: 'Class 10', section: 'A' }, { class_name: 'Class 10', section: 'B' },
  { class_name: 'Class 11', section: 'Science' }, { class_name: 'Class 11', section: 'Commerce' }, { class_name: 'Class 11', section: 'Arts' },
  { class_name: 'Class 12', section: 'Science' }, { class_name: 'Class 12', section: 'Commerce' }, { class_name: 'Class 12', section: 'Arts' }
];

async function seed() {
  console.log('Inserting classes into database...');
  for (const c of classesToInsert) {
    const { error } = await supabase.from('classes').insert(c);
    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error inserting', c, error.message);
    }
  }
  console.log('Seeding completed successfully!');
}

seed();
