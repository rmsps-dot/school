import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAdmin, requireTeacher, requireStudent, requireParent, requireTeacherForClass, requireSelfOrGuardianOf } from './auth-helpers'

// Mock the Next.js cache and Supabase SSR
vi.mock('./supabase/server', () => {
  return {
    createClient: vi.fn()
  }
})

import { createClient } from './supabase/server'

describe('Auth Helpers RBAC', () => {
  const mockGetUser = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: mockFrom
    }

    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq })

    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
  })

  it('requireAdmin allows admin and blocks others', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-123' } } })
    mockSingle.mockResolvedValue({ data: { role: 'admin', id: 'admin-123' } })

    const res = await requireAdmin()
    expect(res.ok).toBe(true)

    mockSingle.mockResolvedValue({ data: { role: 'teacher', id: 'teacher-123' } })
    const res2 = await requireAdmin()
    expect(res2.ok).toBe(false)
    if (!res2.ok) expect(res2.error).toContain('Forbidden')
  })

  it('requireTeacherForClass allows assigned teacher', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 't-123' } } })
    
    // First query: profiles (role check)
    mockSingle.mockResolvedValueOnce({ data: { role: 'teacher', id: 'prof-123' } })
    // Second query: teachers table (teacher id)
    mockSingle.mockResolvedValueOnce({ data: { id: 'teacher-row-1' } })
    // Third query: teacher_classes (assignment)
    mockSingle.mockResolvedValueOnce({ data: { class_id: 'class-A' } })

    const res = await requireTeacherForClass('class-A')
    expect(res.ok).toBe(true)
  })

  it('requireTeacherForClass allows admin bypass', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-123' } } })
    mockSingle.mockResolvedValueOnce({ data: { role: 'admin', id: 'prof-1' } })

    const res = await requireTeacherForClass('class-A', { allowAdmin: true })
    expect(res.ok).toBe(true)
  })

  it('requireSelfOrGuardianOf blocks unrelated parent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'p-123' } } })
    
    // 1: profile
    mockSingle.mockResolvedValueOnce({ data: { role: 'parent', id: 'prof-1' } })
    // 2: parents table
    mockSingle.mockResolvedValueOnce({ data: { id: 'parent-row-1' } })
    // 3: parent_students (null = no relation)
    mockSingle.mockResolvedValueOnce({ data: null })

    const res = await requireSelfOrGuardianOf('student-xyz')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toContain('not a guardian')
  })
})
