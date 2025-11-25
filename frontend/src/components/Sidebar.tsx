import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Plus, Trash2, MessageSquare, Sparkles, Moon, Sun, Github } from 'lucide-react'
import type { HistoryItem } from '../hooks/useResearch'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
  onNewChat: () => void
}

export function Sidebar({ history, onSelect, onClear, onNewChat }: Props) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [isDark])

  const toggleDarkMode = () => setIsDark(!isDark)

  return (
    <div className="w-80 h-full bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20 transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100">Auto-Researcher</h1>
            <p className="text-xs text-slate-400 font-mono">v1.0</p>
          </div>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 dark:bg-slate-100 hover:bg-indigo-600 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">New Research</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Recent
          </h3>
          {history.length > 0 && (
            <button 
              onClick={onClear}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-500 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 px-4"
              >
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400">No research history yet.</p>
              </motion.div>
            ) : (
              history.map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => onSelect(item)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 group transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.topic}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col gap-2">
            <button
                onClick={toggleDarkMode}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer w-full"
            >
                <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
                    <p className="text-xs text-slate-400">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
            </button>
            
            <a 
                href="https://github.com/royxlead/auto-researcher-python.git" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                 <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                    <Github className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Open Source</p>
                    <p className="text-xs text-slate-400 truncate">View on GitHub</p>
                </div>
            </a>

            <div className="text-[10px] text-slate-400 text-center mt-2">
                &copy; {new Date().getFullYear()} Auto-Researcher
            </div>
        </div>
      </div>
    </div>
  )
}
