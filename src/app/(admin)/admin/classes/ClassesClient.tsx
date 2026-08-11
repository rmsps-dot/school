'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import type { SchoolClass } from '@/actions/class-actions'
import { createClass, deleteClass } from '@/actions/class-actions'

export default function ClassesClient({ initialClasses }: { initialClasses: SchoolClass[] }) {
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Form State
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const formData = new FormData()
      formData.append('className', className)
      formData.append('section', section)

      const result = await createClass(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        // Success - Just close the form and let server revalidation refresh the list
        setClassName('')
        setSection('')
        setIsCreating(false)
        window.location.reload() // Quickest way to sync without complex state management since server actions don't auto-update client state unless wrapped in useActionState
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this class? This cannot be undone.')) return
    setError('')
    startTransition(async () => {
      const result = await deleteClass(id)
      if (result?.error) {
        setError(result.error)
      } else {
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-coral" /> Manage Classes
          </h1>
          <p className="text-mist text-sm mt-1">Add, view, or remove classes and sections.</p>
        </div>
        <button
          onClick={() => { setIsCreating(!isCreating); setError(''); }}
          className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Class</>}
        </button>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-hairline"
          >
            <h2 className="text-lg font-bold text-white mb-4">Create New Class</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-parchment">Class Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Class 10"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-parchment">Section</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Class'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes List */}
      <div className="glass rounded-2xl overflow-hidden border border-hairline">
        {classes.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-12 h-12 text-mist mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">No Classes Found</h3>
            <p className="text-mist text-sm mt-1">Start by creating your first class and section.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-hairline">
                  <th className="p-4 text-xs font-semibold text-mist uppercase tracking-wider">Class Name</th>
                  <th className="p-4 text-xs font-semibold text-mist uppercase tracking-wider text-center">Section</th>
                  <th className="p-4 text-xs font-semibold text-mist uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-coral" />
                        </div>
                        <span className="font-bold text-white">{c.class_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="surface-card px-3 py-1 rounded-lg text-sm font-bold text-sky-400 border border-hairline">
                        {c.section}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        title="Delete Class"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
