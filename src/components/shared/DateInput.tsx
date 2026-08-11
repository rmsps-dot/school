'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface DateInputProps {
  id?: string
  label?: string
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  required?: boolean
  className?: string
  labelClass?: string
  name?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DateInput({ id, label, value, onChange, required, className = '', labelClass = '', name }: DateInputProps) {
  const parse = (v: string) => {
    if (!v) return { dd: '', mm: '', yyyy: '' }
    const parts = v.split('-')
    if (parts.length === 3) return { dd: parts[2], mm: parts[1], yyyy: parts[0] }
    return { dd: '', mm: '', yyyy: '' }
  }

  const [dd, setDd] = useState(parse(value).dd)
  const [mm, setMm] = useState(parse(value).mm)
  const [yyyy, setYyyy] = useState(parse(value).yyyy)
  const [showCal, setShowCal] = useState(false)

  const today = new Date()
  const initYear = yyyy ? parseInt(yyyy) : today.getFullYear() - 10
  const initMonth = mm ? parseInt(mm) - 1 : today.getMonth()

  const [calYear, setCalYear] = useState(initYear)
  const [calMonth, setCalMonth] = useState(initMonth)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const calRef = useRef<HTMLDivElement>(null)
  const ddRef = useRef<HTMLInputElement>(null)
  const mmRef = useRef<HTMLInputElement>(null)
  const yyyyRef = useRef<HTMLInputElement>(null)

  // Sync if parent changes value
  useEffect(() => {
    const parsed = parse(value)
    setDd(parsed.dd)
    setMm(parsed.mm)
    setYyyy(parsed.yyyy)
    if (parsed.yyyy) setCalYear(parseInt(parsed.yyyy))
    if (parsed.mm) setCalMonth(parseInt(parsed.mm) - 1)
  }, [value])

  // Close calendar on outside click
  useEffect(() => {
    if (!showCal) return
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCal(false)
        setShowYearPicker(false)
        setShowMonthPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCal])

  const emit = (d: string, m: string, y: string) => {
    if (d && m && y && y.length === 4) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  const handleDd = (val: string) => {
    const c = val.replace(/\D/g, '').slice(0, 2)
    setDd(c); emit(c, mm, yyyy)
    if (c.length === 2) mmRef.current?.focus()
  }
  const handleMm = (val: string) => {
    const c = val.replace(/\D/g, '').slice(0, 2)
    setMm(c); emit(dd, c, yyyy)
    if (c.length === 2) yyyyRef.current?.focus()
  }
  const handleYyyy = (val: string) => {
    const c = val.replace(/\D/g, '').slice(0, 4)
    setYyyy(c); emit(dd, mm, c)
  }
  const handleMmKey = (e: React.KeyboardEvent) => { if (e.key === 'Backspace' && mm === '') ddRef.current?.focus() }
  const handleYyyyKey = (e: React.KeyboardEvent) => { if (e.key === 'Backspace' && yyyy === '') mmRef.current?.focus() }

  // Calendar selection
  const selectDay = (day: number) => {
    const newDd = String(day).padStart(2, '0')
    const newMm = String(calMonth + 1).padStart(2, '0')
    const newYyyy = String(calYear)
    setDd(newDd); setMm(newMm); setYyyy(newYyyy)
    onChange(`${newYyyy}-${newMm}-${newDd}`)
    setShowCal(false)
  }

  const selectedDay = dd && mm && yyyy ? parseInt(dd) : null
  const isSelected = (day: number) =>
    selectedDay === day &&
    parseInt(mm) - 1 === calMonth &&
    parseInt(yyyy) === calYear

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  const yearRange = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i)

  const inputBase = 'bg-transparent outline-none text-center font-mono text-sm text-parchment placeholder-mist/30 w-full'

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={calRef}>
      {label && (
        <label className={`text-sm font-medium text-parchment ${labelClass}`}>
          {label} {required && <span className="text-coral">*</span>}
        </label>
      )}

      {/* Input Row */}
      <div className="relative flex items-center gap-0 rounded-xl input-glass px-3 py-3 focus-within:ring-2 focus-within:ring-coral/50 transition-all">
        {/* Manual DD/MM/YYYY */}
        <input ref={ddRef} id={id} name={name ? `${name}_dd` : undefined} type="text" inputMode="numeric"
          maxLength={2} placeholder="DD" value={dd} onChange={e => handleDd(e.target.value)}
          className={`${inputBase} w-8`} />
        <span className="text-mist/40 select-none mx-0.5">/</span>
        <input ref={mmRef} type="text" inputMode="numeric" maxLength={2} placeholder="MM" value={mm}
          onChange={e => handleMm(e.target.value)} onKeyDown={handleMmKey}
          className={`${inputBase} w-8`} />
        <span className="text-mist/40 select-none mx-0.5">/</span>
        <input ref={yyyyRef} type="text" inputMode="numeric" maxLength={4} placeholder="YYYY" value={yyyy}
          onChange={e => handleYyyy(e.target.value)} onKeyDown={handleYyyyKey}
          className={`${inputBase} w-14`} />

        {/* Calendar Toggle Button */}
        <button
          type="button"
          onClick={() => { setShowCal(v => !v); setShowYearPicker(false); setShowMonthPicker(false) }}
          className="ml-auto flex-shrink-0 p-1 rounded-lg text-mist hover:text-coral transition-colors"
          title="Open calendar"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Modern Custom Calendar Dropdown */}
      {showCal && (
        <div className="absolute top-full mt-2 left-0 z-50 w-72 rounded-2xl border border-hairline bg-surface shadow-2xl shadow-black/50 p-4 backdrop-blur-sm">

          {/* Header: Month & Year */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => { setCalMonth(m => m === 0 ? 11 : m - 1); if (calMonth === 0) setCalYear(y => y - 1) }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-mist hover:text-parchment">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {/* Month selector */}
              <button type="button" onClick={() => { setShowMonthPicker(v => !v); setShowYearPicker(false) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-sm font-semibold text-parchment">
                {MONTHS[calMonth]} <ChevronDown className="w-3 h-3" />
              </button>
              {/* Year selector */}
              <button type="button" onClick={() => { setShowYearPicker(v => !v); setShowMonthPicker(false) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-sm font-semibold text-coral">
                {calYear} <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <button type="button" onClick={() => { setCalMonth(m => m === 11 ? 0 : m + 1); if (calMonth === 11) setCalYear(y => y + 1) }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-mist hover:text-parchment">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Picker Overlay */}
          {showMonthPicker && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {MONTHS.map((m, i) => (
                <button key={m} type="button"
                  onClick={() => { setCalMonth(i); setShowMonthPicker(false) }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${i === calMonth ? 'bg-coral text-ink' : 'hover:bg-white/10 text-mist hover:text-parchment'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Year Picker Overlay */}
          {showYearPicker && (
            <div className="h-40 overflow-y-auto mb-3 grid grid-cols-3 gap-1 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent content-start">
              {yearRange.map(y => (
                <button key={y} type="button"
                  onClick={() => { setCalYear(y); setShowYearPicker(false) }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${y === calYear ? 'bg-coral text-ink' : 'hover:bg-white/10 text-mist hover:text-parchment'}`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Day headers */}
          {!showYearPicker && !showMonthPicker && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-mist uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const sel = isSelected(day)
                  return (
                    <button key={day} type="button" onClick={() => selectDay(day)}
                      className={`aspect-square w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all
                        ${sel ? 'bg-coral text-ink font-bold scale-110 shadow-lg shadow-coral/30' : 'hover:bg-white/10 text-parchment hover:text-white'}`}>
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-hairline flex justify-between items-center">
            <button type="button"
              onClick={() => { const t = new Date(); selectDay(t.getDate()); setCalYear(t.getFullYear()); setCalMonth(t.getMonth()) }}
              className="text-xs text-coral hover:text-coral/80 font-medium transition-colors">
              Today
            </button>
            <button type="button" onClick={() => { setShowCal(false); setShowYearPicker(false); setShowMonthPicker(false) }}
              className="text-xs text-mist hover:text-parchment transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
