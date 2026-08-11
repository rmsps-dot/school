'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, ChevronDown, Save, UserCheck } from 'lucide-react'
import { updateTeacherClasses } from '@/actions/assign-classes-actions'

export interface AssignTeacher {
  id: string
  full_name: string
  email: string
  assignedClassIds: string[]
}

export interface AssignClass {
  id: string
  class_name: string
  section: string
}

export default function AssignClassesClient({ teachers, classes }: { teachers: AssignTeacher[], classes: AssignClass[] }) {
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string[]>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Initialize selected classes when expanding
  const toggleTeacher = (teacherId: string) => {
    if (expandedTeacher === teacherId) {
      setExpandedTeacher(null)
    } else {
      setExpandedTeacher(teacherId)
      // Reset the local state to match DB when opening
      const teacher = teachers.find(t => t.id === teacherId)
      if (teacher) {
        setSelectedClasses(prev => ({
          ...prev,
          [teacherId]: teacher.assignedClassIds || []
        }))
      }
      setSaveMessage(null)
    }
  }

  const toggleClass = (teacherId: string, classId: string) => {
    setSelectedClasses(prev => {
      const current = prev[teacherId] || []
      const newClasses = current.includes(classId)
        ? current.filter(id => id !== classId)
        : [...current, classId]
      return { ...prev, [teacherId]: newClasses }
    })
    setSaveMessage(null)
  }

  const handleSave = async (teacherId: string) => {
    setIsSaving(true)
    setSaveMessage(null)
    const newAssignments = selectedClasses[teacherId] || []
    
    const result = await updateTeacherClasses(teacherId, newAssignments)
    
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Classes updated successfully!' })
      // Close the expanded panel automatically
      setTimeout(() => {
        setExpandedTeacher(null)
        setSaveMessage(null)
      }, 500)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update.' })
    }
    setIsSaving(false)
  }

  if (teachers.length === 0) {
    return (
      <div className="surface-card border-hairline rounded-3xl p-16 text-center shadow-2xl">
        <UserCheck className="w-16 h-16 text-mist mx-auto mb-6 opacity-30" />
        <h2 className="font-display text-2xl font-bold text-parchment">No Teachers Found</h2>
        <p className="text-mist mt-2 max-w-sm mx-auto">No teachers are currently registered in the system.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher, i) => {
        const isExpanded = expandedTeacher === teacher.id
        const currentSelections = selectedClasses[teacher.id] || teacher.assignedClassIds || []
        const isDirty = JSON.stringify(currentSelections.sort()) !== JSON.stringify((teacher.assignedClassIds || []).sort())

        return (
          <div key={teacher.id} className="ledger-row surface-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-coral/40 border-hairline shadow-lg" style={{ animationDelay: `${i * 0.05}s` }}>
            {/* Header */}
            <div 
              onClick={() => toggleTeacher(teacher.id)}
              className="p-6 flex items-center justify-between cursor-pointer bg-surface hover:bg-ink transition-colors"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-ink border border-hairline flex items-center justify-center text-coral font-display font-bold text-xl shadow-inner">
                  {teacher.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-parchment font-bold text-lg font-display">{teacher.full_name}</h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-mist mt-0.5">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-coral/10 text-coral uppercase tracking-wider border border-coral/20">
                  {teacher.assignedClassIds?.length || 0} classes assigned
                </span>
                <ChevronDown className={`w-5 h-5 text-mist transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-hairline"
                >
                  <div className="p-8 bg-ink">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-bold text-coral uppercase tracking-widest">Select Classes</h4>
                      {saveMessage && (
                        <span className={`text-xs font-mono uppercase tracking-widest ${saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {saveMessage.text}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                      {classes.map((cls) => {
                        const isSelected = currentSelections.includes(cls.id)
                        return (
                          <div
                            key={cls.id}
                            onClick={() => toggleClass(teacher.id, cls.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                              isSelected 
                                ? 'bg-coral/10 border-coral shadow-[0_0_15px_rgba(255,127,80,0.15)]' 
                                : 'bg-surface border-hairline hover:border-mist hover:bg-surface/80'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                              isSelected ? 'bg-coral border-coral' : 'border-mist bg-ink'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-ink" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-bold truncate ${isSelected ? 'text-coral' : 'text-parchment'}`}>{cls.class_name}</span>
                              {cls.section && <span className="text-[10px] font-mono text-mist uppercase tracking-widest mt-0.5">Section {cls.section}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-hairline">
                      <button 
                        onClick={() => toggleTeacher(teacher.id)}
                        className="px-6 py-3 rounded-xl text-sm font-semibold text-mist bg-surface border border-hairline hover:border-mist transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSave(teacher.id)}
                        disabled={isSaving || !isDirty}
                        className="bg-coral text-ink py-3 px-8 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#E67E6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
