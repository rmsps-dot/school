import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testTeacherParentChat() {
  console.log('--- Testing Parent Chat for Teacher ---')

  // 1. Find a teacher to simulate
  const { data: teachers, error: tErr } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .limit(1)
    
  const teacher = teachers[0]
  console.log(`Simulating as Teacher: ${teacher.full_name} (${teacher.id})`)

  // 2. Fetch the assigned classes for this teacher from teacher_classes
  // First get teacher.id
  const { data: teacherRow } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('profile_id', teacher.id)
    .single()
    
  const { data: tClasses } = await supabaseAdmin
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', teacherRow.id)
    
  const assignedClassIds = tClasses.map(c => c.class_id)
  console.log('Teacher assigned classes:', assignedClassIds)

  console.log(`\nRunning getContactsForTeacher('parents', 'all') logic:`)
  
  // Simulate client.from('students') WITH RLS:
  let query = supabaseAdmin
    .from('students')
    .select('id, student_id, profiles!students_profile_id_fkey(full_name)')
    .in('class_id', assignedClassIds)
  
  const { data: students, error: studErr } = await query
  console.log(`\nFound ${students?.length || 0} students. Error: ${studErr?.message || 'none'}`)

  if (!students || students.length === 0) {
    console.log('No students found, returning empty.')
    return
  }

  const studentUuids = students.map(s => s.id)
  
  // Find parents linked to these students
  const { data: parentLinks, error: parentErr } = await supabaseAdmin
    .from('parent_students')
    .select('parent_id, student_id')
    .in('student_id', studentUuids)
    
  console.log(`\nFound ${parentLinks?.length || 0} parent_students links. Error: ${parentErr?.message || 'none'}`)
  
  if (parentLinks?.length) {
     console.log('Parent Links:', parentLinks.slice(0, 2))
  }
  
  if (!parentLinks || parentLinks.length === 0) {
     console.log('No parent links found, returning empty.')
     return
  }
  
  const parentIds = [...new Set(parentLinks.map(p => p.parent_id))]
  
  // Fetch parent profiles
  const { data: parents, error: profileErr } = await supabaseAdmin
    .from('parents')
    .select('id, profile_id, profiles!parents_profile_id_fkey(full_name, role)')
    .in('id', parentIds)
    
  console.log(`\nFound ${parents?.length || 0} parents. Error: ${profileErr?.message || 'none'}`)
}

testTeacherParentChat()
