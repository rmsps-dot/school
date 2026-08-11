'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit2, Trash2, Megaphone, Loader2 } from 'lucide-react'
import type { Notice, TargetRole } from '@/actions/notice-actions'
import { createNotice, updateNotice, deleteNotice } from '@/actions/notice-actions'

interface Props {
  initialNotices: Notice[]
}

const INPUT_CLASS = "w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all"

export default function AdminNoticesClient({ initialNotices }: Props) {
  const [notices, setNotices] = useState(initialNotices)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetRole, setTargetRole] = useState<TargetRole>('all')

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setTargetRole('all')
    setError('')
  }

  const handleEdit = (n: Notice) => {
    setEditingId(n.id)
    setTitle(n.title)
    setContent(n.content)
    setTargetRole(n.target_role)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = editingId
        ? await updateNotice(editingId, title, content, targetRole)
        : await createNotice(title, content, targetRole)
      if (!res.success) {
        setError(res.error || 'Failed to save notice.')
      } else {
        window.location.reload()
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    startTransition(async () => {
      const res = await deleteNotice(id)
      if (!res.success) alert(res.error || 'Failed to delete notice.')
      else window.location.reload()
    })
  }

  const roleLabels: Record<TargetRole, string> = {
    all: 'Everyone', teacher: 'Teachers Only', student: 'Students Only', parent: 'Parents Only',
  }
  const roleColors: Record<TargetRole, string> = {
    all: 'text-parchment border-hairline', teacher: 'text-veena-blue border-veena-blue/30',
    student: 'text-coral border-coral/30', parent: 'text-gold border-gold/30',
  }

  return (
    <div className="space-y-8">
      {/* ── Publish Form ── */}
      <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-coral/30"
            style={{ background: 'rgba(241,145,125,0.1)' }}>
            <Megaphone className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-parchment">
              {editingId ? 'Edit Notice' : 'Publish New Notice'}
            </h2>
            <p className="text-sm text-mist">Announce global or targeted updates.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider">Title</label>
              <input
                required type="text"
                placeholder="e.g., Annual Sports Day 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider">Target Audience</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as TargetRole)}
                className={INPUT_CLASS + ' appearance-none cursor-pointer'}
              >
                <option value="all" className="bg-ink text-parchment">Everyone</option>
                <option value="teacher" className="bg-ink text-parchment">Teachers Only</option>
                <option value="student" className="bg-ink text-parchment">Students Only</option>
                <option value="parent" className="bg-ink text-parchment">Parents Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist uppercase tracking-wider">Message Content</label>
            <textarea
              required rows={4}
              placeholder="Write your announcement here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className={INPUT_CLASS + ' resize-y min-h-[100px]'}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit" disabled={isPending}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm text-ink transition-all hover:scale-[1.01] disabled:opacity-60"
              style={{ background: 'var(--coral)' }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {editingId ? 'Save Changes' : 'Publish Notice'}
            </button>
            {editingId && (
              <button
                type="button" onClick={resetForm} disabled={isPending}
                className="px-6 py-2.5 rounded-xl font-semibold text-mist hover:text-parchment surface-card border border-hairline transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Active Notices List ── */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-parchment px-1">Manage Notices</h3>

        {notices.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center border border-hairline">
            <Megaphone className="w-12 h-12 text-mist/30 mx-auto mb-3" />
            <p className="text-mist text-sm">No notices published yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notices.map((n) => (
              <div key={n.id} className="surface-card border border-hairline rounded-2xl p-6 flex flex-col md:flex-row gap-5 hover:border-coral/20 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-display text-lg font-bold text-parchment truncate">{n.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${roleColors[n.target_role]}`}
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {roleLabels[n.target_role]}
                    </span>
                  </div>
                  <p className="text-sm text-mist line-clamp-2 leading-relaxed">{n.content}</p>
                  <p className="text-xs text-mist/50 mt-3 font-medium">
                    Published: {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex md:flex-col gap-2 items-start md:items-end md:justify-center border-t md:border-t-0 border-hairline pt-4 md:pt-0 shrink-0">
                  <button
                    onClick={() => handleEdit(n)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-veena-blue border border-veena-blue/20 hover:bg-veena-blue/10 transition-colors w-full md:w-auto justify-center"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors w-full md:w-auto justify-center"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
