import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, Circle, Brain, Search, FileText, PenTool, Scale } from 'lucide-react'
import { useState, useEffect } from 'react'

const STEPS = [
  { id: 'research', label: "Searching academic databases", icon: Search },
  { id: 'draft', label: "Synthesizing & Drafting", icon: PenTool },
  { id: 'critique', label: "Critiquing & Refining", icon: Scale }
]

export function LoadingState() {
  const [activeStepId, setActiveStepId] = useState<string>('research')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.status === 'running') {
        setActiveStepId(detail.step)
      } else if (detail.status === 'completed') {
        setCompletedSteps(prev => new Set(prev).add(detail.step))
      }
    }

    window.addEventListener('research-progress', handleProgress)
    return () => window.removeEventListener('research-progress', handleProgress)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 w-full max-w-md mx-auto">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-300 dark:bg-indigo-900/30 blur-xl opacity-20 animate-pulse" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="relative bg-white dark:bg-slate-900 p-4 rounded-full border border-indigo-100 dark:border-indigo-900 shadow-sm"
        >
          <Brain className="w-8 h-8 text-indigo-400" />
        </motion.div>
      </div>
      
      <div className="w-full space-y-4">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = activeStepId === step.id && !isCompleted
          
          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 ${
                isCurrent 
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm scale-105' 
                  : isCompleted 
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60' 
                    : 'bg-transparent border-transparent opacity-30'
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <step.icon className={`w-4 h-4 ${isCurrent ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
