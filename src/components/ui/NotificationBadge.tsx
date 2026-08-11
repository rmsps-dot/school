import { motion, AnimatePresence } from 'framer-motion'

interface NotificationBadgeProps {
  count?: number
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <AnimatePresence>
      {count !== undefined && count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-red-400"
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
