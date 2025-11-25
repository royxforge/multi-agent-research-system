import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronRight, Trash2 } from 'lucide-react'
import type { HistoryItem } from '../hooks/useResearch'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
}

export function HistorySidebar({ history, onSelect, onClear }: Props) {
  if (history.length === 0) return null

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 transform -translate-x-full xl:translate-x-0 transition-transform z-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" />
          History
        </h3>
        <button 
          onClick={onClear}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-100px)] pr-2 custom-scrollbar">
        <AnimatePresence>
          {history.map((item) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => onSelect(item)}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
            >
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-2 group-hover:text-indigo-500 transition-colors">
                {item.topic}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
