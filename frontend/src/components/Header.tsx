import { motion } from 'framer-motion'
import { Sparkles, Github } from 'lucide-react'

export function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-6 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Auto-Researcher
          </h1>
          <p className="text-xs text-slate-400 font-mono">MULTI-AGENT SYSTEM v1.0</p>
        </div>
      </div>
      
      <a 
        href="https://github.com" 
        target="_blank" 
        rel="noreferrer"
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Github className="w-5 h-5 text-slate-400" />
      </a>
    </motion.header>
  )
}
