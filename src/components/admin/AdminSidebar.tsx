"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AvatarUpload from '@/components/ui/AvatarUpload';
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  UserCheck,
  Heart,
  Megaphone,
  ImageIcon,
  CalendarClock,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  FileStack,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import NotificationBadge from "@/components/ui/NotificationBadge";
import { getSidebarCounts, SidebarCounts } from "@/actions/notification-actions";

const NAV_ITEMS = [
  { label: "Dashboard",         href: "/admin",           icon: LayoutDashboard },
  { label: "Notice Board",      href: "/admin/notices",   icon: Megaphone       },
  { label: "Pending Requests",  href: "/admin/requests",  icon: ClipboardList   },
  { label: "Result Approval",   href: "/admin/results",        icon: ClipboardCheck  },
  { label: "Manage Results",    href: "/admin/manage-results",  icon: FileStack       },
  { label: "Leave Approvals",   href: "/admin/leaves",    icon: CalendarClock   },
  { label: "Messages",          href: "/admin/chat",      icon: MessageSquare   },
  { label: "Manage Classes",    href: "/admin/classes",   icon: BookOpen        },
  { label: "Assign Classes",    href: "/admin/assign-classes", icon: ClipboardList },
  { label: "School Gallery",    href: "/admin/gallery",   icon: ImageIcon       },
  { label: "Manage Students",   href: "/admin/students",  icon: GraduationCap   },
  { label: "Manage Teachers",   href: "/admin/teachers",  icon: UserCheck       },
  { label: "Manage Parents",    href: "/admin/parents",   icon: Heart           },
  { label: "Homework History",  href: "/admin/homework",  icon: BookOpen        },
  { label: "Settings",          href: "/admin/settings",  icon: Settings        },
];

interface Props {
  adminName: string;
  adminAvatar?: string | null;
}

interface SidebarContentProps {
  pathname: string
  counts: SidebarCounts
  adminName: string
  adminAvatar?: string | null
  onClose: () => void
  onLogout: () => Promise<void>
  onRefresh: () => void
}

function SidebarContent({ pathname, counts, adminName, adminAvatar, onClose, onLogout, onRefresh }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-ink flex items-center justify-center flex-shrink-0 border border-hairline shadow-lg">
          <Image src="/icon-192.png" alt="RMSPS School Logo" width={48} height={48} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-display text-parchment font-bold text-xl tracking-widest leading-tight">RMSPS</p>
          <p className="text-mist text-xs uppercase tracking-widest mt-0.5">Admin</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

          let badgeCount = 0
          if (label === 'Messages') badgeCount = counts.messages
          if (label === 'Pending Requests') badgeCount = counts.requests || 0
          if (label === 'Result Approval') badgeCount = counts.results || 0
          if (label === 'Leave Approvals') badgeCount = counts.leaves || 0

          return (
            <Link
              key={href}
              href={href}
              id={`sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${active ? 'bg-coral text-ink' : 'text-mist hover:text-coral hover:bg-coral/5'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              <NotificationBadge count={badgeCount} />
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-hairline pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <AvatarUpload currentPhotoUrl={adminAvatar} size="xs" onUploadSuccess={onRefresh} />
          <div className="min-w-0">
            <p className="text-parchment text-sm font-medium truncate">{adminName}</p>
            <p className="text-mist text-xs">Administrator</p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-mist hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ adminName, adminAvatar }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<SidebarCounts>({ messages: 0 })

  useEffect(() => {
    const fetchCounts = async () => {
      const res = await getSidebarCounts()
      if ('data' in res && res.data) setCounts(res.data)
    }
    fetchCounts()

    const handleVisibility = () => {
      if (!document.hidden) fetchCounts()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (!document.hidden) fetchCounts()
    }, 60000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 bg-ink border-b border-hairline flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg bg-surface text-mist hover:text-parchment transition-colors" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-ink border border-hairline flex-shrink-0 shadow-md">
            <Image src="/icon-192.png" alt="RMSPS School Logo" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-parchment font-bold text-lg tracking-widest">RMSPS Admin</span>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-ink border-r border-hairline">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface text-mist hover:text-parchment">
                <X className="w-4 h-4" />
              </button>
              <SidebarContent pathname={pathname} counts={counts} adminName={adminName} adminAvatar={adminAvatar} onClose={() => setOpen(false)} onLogout={handleLogout} onRefresh={() => router.refresh()} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-72 bg-ink border-r border-hairline z-40">
        <SidebarContent pathname={pathname} counts={counts} adminName={adminName} adminAvatar={adminAvatar} onClose={() => setOpen(false)} onLogout={handleLogout} onRefresh={() => router.refresh()} />
      </aside>
    </>
  )
}
