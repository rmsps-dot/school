import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Users, CalendarDays, Loader2, Save, ArrowRight, UserCircle, Plus, Trash2, Edit, AlertCircle, FileSpreadsheet, ListChecks, CheckSquare, ChevronDown, FileText, CheckCircle2, X, Download } from 'lucide-react'
import React from 'react'
import { updateTeacherResult, deleteTeacherResult } from '@/actions/manage-results-actions'
import MarksheetModal from '@/components/admin/MarksheetModal'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import type { Database } from '@/types/supabase'
import { downloadMarksheetPDF } from '@/utils/download-marksheet-pdf'

export interface TeacherResultRecord {
  id: string
  student_id: string
  class_id: string
  exam_type: Database['public']['Enums']['exam_type']
  subject: string
  marks_obtained: number
  total_marks: number
  max_marks?: number
  uploaded_by: string
  is_approved: boolean
  created_at: string
  edit_request?: Record<string, unknown> | null
  delete_request?: boolean | null
  students: {
    id: string
    student_id: string
    father_name: string | null
    mother_name: string | null
    profiles: {
      full_name: string | null
      dob: string | null
      address: string | null
    } | null
  } | null
  classes: {
    id: string
    class_name: string
    section: string
  } | null
}

interface Props {
  initialResults: TeacherResultRecord[]
}

export default function ManageResultsClient({ initialResults }: Props) {
  const [results, setResults] = useState<TeacherResultRecord[]>(initialResults)
  const [isPending, startTransition] = useTransition()
  
  const [editResult, setEditResult] = useState<TeacherResultRecord | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [previewSheet, setPreviewSheet] = useState<StudentMarksheet | null>(null)

  async function handleGeneratePDF(sheet: StudentMarksheet) {
    const key = `${sheet.studentRowId}-${sheet.examType}`
    setDownloadingKey(key)
    try {
      await downloadMarksheetPDF(sheet, sheet.approvedAt ?? new Date().toISOString())
    } catch (err) {
      console.error('PDF Download failed:', err)
    } finally {
      setDownloadingKey(null)
    }
  }

  const mapGroupToMarksheet = (group: { totalObtained: number, grandTotal: number, student_id: string, class_id: string, exam_type: Database['public']['Enums']['exam_type'], students: TeacherResultRecord['students'], classes: TeacherResultRecord['classes'], subjectsList: TeacherResultRecord[] }): StudentMarksheet => {
    const totalObtained = group.totalObtained
    const grandTotal = group.grandTotal
    const percentage = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0
    
    // Calculate grade
    let grade = 'F'
    if (percentage >= 91) grade = 'A1'
    else if (percentage >= 81) grade = 'A2'
    else if (percentage >= 71) grade = 'B1'
    else if (percentage >= 61) grade = 'B2'
    else if (percentage >= 51) grade = 'C1'
    else if (percentage >= 41) grade = 'C2'
    else if (percentage >= 33) grade = 'D'

    return {
      studentRowId: group.student_id,
      studentCode: group.students?.student_id || 'N/A',
      studentName: group.students?.profiles?.full_name || 'N/A',
      fatherName: group.students?.father_name || null,
      motherName: group.students?.mother_name || null,
      dob: group.students?.profiles?.dob || null,
      address: group.students?.profiles?.address || null,
      classId: group.class_id,
      className: group.classes?.class_name || 'N/A',
      section: group.classes?.section || '-',
      examType: group.exam_type,
      teacherName: null,
      subjects: group.subjectsList.map((sub: TeacherResultRecord) => ({
        id: sub.id,
        subject: sub.subject,
        marksObtained: sub.marks_obtained,
        totalMarks: sub.total_marks || sub.max_marks || 100,
        passingMarks: Math.ceil((sub.total_marks || sub.max_marks || 100) * 0.33),
      })),
      totalObtained,
      grandTotal,
      percentage,
      grade,
    }
  }

  const handleEditResult = (r: TeacherResultRecord) => setEditResult(r)

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!editResult) return
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateTeacherResult(editResult.id, fd)
      if (res.error) {
        setErrorMsg(res.error)
      } else if ('pending' in res && res.pending) {
        alert('Edit request submitted for admin approval.')
        setEditResult(null)
      } else {
        setResults(prev => prev.map(r => r.id === editResult.id ? { 
          ...r, 
          marks_obtained: parseFloat(fd.get('marksObtained') as string),
          total_marks: parseFloat(fd.get('totalMarks') as string)
        } : r))
        setEditResult(null)
      }
    })
  }

  const handleDeleteResult = async (resultIds: string[]) => {
    if (!confirm('Are you sure you want to delete this entire result (all subjects)?')) return
    
    startTransition(async () => {
      const res = await deleteTeacherResult(resultIds)
      if (res.error) {
        setErrorMsg(res.error)
      } else if ('pending' in res && res.pending) {
        alert('Delete request submitted for admin approval for all subjects.')
        setResults(prev => prev.map(r => resultIds.includes(r.id) ? { ...r, delete_request: true } : r))
      } else {
        setResults(prev => prev.filter(r => !resultIds.includes(r.id)))
      }
    })
  }

  return (
    <div className="surface-card rounded-2xl border border-hairline overflow-hidden">
        {/* MAIN RESULTS TABLE */}
        <div className="bg-ink rounded-2xl border border-hairline overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-surface border-b border-hairline">
              <tr>
                <th className="p-4 w-12"></th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Student</th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Exam Type</th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Subject</th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Marks</th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Grade</th>
                <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(() => {
                const grouped = new Map<string, typeof results[0] & { subjectsList: typeof results, totalObtained: number, grandTotal: number }>()
                results.forEach(r => {
                  const key = `${r.student_id}_${r.exam_type}`
                  if (!grouped.has(key)) {
                    grouped.set(key, { ...r, subjectsList: [], totalObtained: 0, grandTotal: 0 })
                  }
                  const g = grouped.get(key)!
                  g.subjectsList.push(r)
                  g.totalObtained += r.marks_obtained
                  g.grandTotal += (r.total_marks || r.max_marks || 100)
                })
                const groupedArr = Array.from(grouped.values())

                if (groupedArr.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-mist font-mono text-sm tracking-widest uppercase">
                        No results have been uploaded yet.
                      </td>
                    </tr>
                  )
                }

                return groupedArr.map((group, i) => {
                  const key = `${group.student_id}_${group.exam_type}`
                  const p = (group.totalObtained / (group.grandTotal || 1)) * 100
                  let grade = 'F'
                  if (p >= 90) grade = 'A+'
                  else if (p >= 80) grade = 'A'
                  else if (p >= 70) grade = 'B+'
                  else if (p >= 60) grade = 'B'
                  else if (p >= 50) grade = 'C'
                  else if (p >= 40) grade = 'D'

                  const hasMultiple = group.subjectsList.length > 1
                  
                  // Action buttons component (only Edit now)
                  const ActionButtons = ({ r }: { r: TeacherResultRecord }) => (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditResult(r)}
                        className="text-mist hover:text-veena-blue p-2 rounded-lg hover:bg-veena-blue/10 transition-colors border border-transparent hover:border-veena-blue/30"
                        title="Edit Result"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )

                  return (
                    <React.Fragment key={group.id || key}>
                      <tr 
                        className="ledger-row hover:bg-surface/50 transition-colors group cursor-pointer" 
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => {
                          if (!hasMultiple) return
                          setExpandedRows(prev => {
                            const next = new Set(prev)
                            if (next.has(key)) next.delete(key)
                            else next.add(key)
                            return next
                          })
                        }}
                      >
                        <td className="p-4 text-center">
                          {hasMultiple && (
                            <div className="w-6 h-6 rounded flex items-center justify-center text-mist group-hover:text-coral transition-colors" title="This exam has multiple subjects. Click to expand/collapse individual subjects.">
                              {expandedRows.has(key) ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50 -rotate-90" />}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-parchment">{group.students?.profiles?.full_name}</div>
                          <div className="text-[10px] font-mono text-mist tracking-widest mt-1">{group.students?.student_id}</div>
                        </td>
                        <td className="p-4 text-sm text-mist">{group.exam_type}</td>
                        <td className="p-4 text-sm font-semibold text-parchment">
                          {hasMultiple ? <span className="text-coral bg-coral/10 px-2 py-0.5 rounded text-xs">{group.subjectsList.length} Subjects</span> : group.subject}
                        </td>
                        <td className="p-4 text-center font-bold text-parchment">
                          {group.totalObtained} <span className="text-mist font-normal">/ {group.grandTotal}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider ${grade === 'F' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-coral/20 text-coral border-coral/30'}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteResult(group.subjectsList.map((s: TeacherResultRecord) => s.id))
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-mist hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Entire Result"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewSheet(mapGroupToMarksheet(group))
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-mist hover:text-veena-blue p-2 rounded-lg hover:bg-veena-blue/10 transition-colors"
                              title="Preview PDF"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGeneratePDF(mapGroupToMarksheet(group))
                              }}
                              disabled={downloadingKey === `${group.student_id}-${group.exam_type}`}
                              className="flex items-center gap-1.5 text-xs font-bold text-veena-blue hover:text-coral p-2 rounded-lg hover:bg-veena-blue/10 disabled:opacity-50 transition-colors"
                              title="Download PDF"
                            >
                              {downloadingKey === `${group.student_id}-${group.exam_type}` ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  Download PDF
                                </>
                              )}
                            </button>
                            {!hasMultiple && <div className="ml-2 pl-2 border-l border-hairline"><ActionButtons r={group.subjectsList[0]} /></div>}
                            {hasMultiple && (
                              <span className="ml-2 text-[10px] text-mist/50 uppercase tracking-widest pl-2 border-l border-hairline">Multiple</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {hasMultiple && expandedRows.has(key) && group.subjectsList.map((sub: TeacherResultRecord, j: number) => {
                        const sp = (sub.marks_obtained / (sub.total_marks || sub.max_marks || 1)) * 100
                        let sg = 'F'
                        if (sp >= 90) sg = 'A+'
                        else if (sp >= 80) sg = 'A'
                        else if (sp >= 70) sg = 'B+'
                        else if (sp >= 60) sg = 'B'
                        else if (sp >= 50) sg = 'C'
                        else if (sp >= 40) sg = 'D'

                        return (
                          <tr key={sub.id} className="bg-surface/20 border-t border-hairline/50 hover:bg-surface/40 transition-colors">
                            <td className="p-3"></td>
                            <td className="p-3 border-l-2 border-hairline"></td>
                            <td className="p-3 text-xs text-mist/60">{sub.exam_type}</td>
                            <td className="p-3 text-sm font-medium text-parchment/80">{sub.subject}</td>
                            <td className="p-3 text-center text-sm font-medium text-parchment/80">
                              {sub.marks_obtained} <span className="text-mist/60 font-normal">/ {sub.total_marks || sub.max_marks}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-xs font-bold text-mist/80">{sg}</span>
                            </td>
                            <td className="p-3 pr-4">
                              <div className="flex justify-end items-center gap-2">
                                {(sub.edit_request || sub.delete_request) && (
                                  <span className="text-[10px] text-coral/80 border border-coral/30 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap bg-coral/10">
                                    {sub.delete_request ? 'Delete Pending' : 'Edit Pending'}
                                  </span>
                                )}
                                <ActionButtons r={sub} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })
              })()}
            </tbody>
          </table>
        </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-2xl border border-hairline w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-parchment">Edit Marks</h2>
                <button onClick={() => setEditResult(null)} className="text-mist hover:text-parchment transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="surface-card p-4 rounded-xl border border-hairline">
                  <p className="text-sm font-medium text-parchment mb-1">{editResult.students?.profiles?.full_name}</p>
                  <p className="text-xs text-coral font-mono mb-2">{editResult.subject} — {editResult.exam_type}</p>
                  <p className="text-[10px] text-mist uppercase tracking-wider font-bold">Class {editResult.classes?.class_name} {editResult.classes?.section}</p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <p>{errorMsg}</p>
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Marks Obtained</label>
                      <input
                        type="number" name="marksObtained" defaultValue={editResult.marks_obtained}
                        required step="0.01" min="0"
                        className="w-full input-glass rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Total Marks</label>
                      <input
                        type="number" name="totalMarks" defaultValue={editResult.total_marks}
                        required step="0.01" min="1"
                        className="w-full input-glass rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral/60 transition-all"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button type="button" onClick={() => setEditResult(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm surface-card text-parchment hover:text-parchment border border-hairline transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isPending}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm flex justify-center items-center text-ink transition-all"
                      style={{ background: 'var(--coral)' }}>
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* PDF PREVIEW MODAL */}
      {previewSheet && (
        <MarksheetModal
          sheet={previewSheet}
          onClose={() => setPreviewSheet(null)}
          readOnly
        />
      )}
    </div>
  )
}
