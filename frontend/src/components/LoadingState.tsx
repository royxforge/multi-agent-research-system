import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'
import { useState, useEffect } from 'react'

const STEPS = [
  { label: "Initializing agents", duration: 2000 },
  { label: "Searching academic databases (Arxiv, Edu)", duration: 5000 },
  { label: "Reading & parsing PDFs", duration: 8000 },
  { label: "Synthesizing findings", duration: 6000 },
  { label: "Drafting literature review", duration: 6000 },
  { label: "Critiquing & refining", duration: 4000 }
]

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    
    const runSteps = (index: number) => {
      if (index >= STEPS.length) return
      
      timeout = setTimeout(() => {
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
        runSteps(index + 1)
      }, STEPS[index].duration)
    }

    runSteps(0)
    return () => clearTimeout(timeout)
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
          <Loader2 className="w-8 h-8 text-indigo-400" />
        </motion.div>
      </div>
      
      <div className="w-full space-y-4">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep
          const isCurrent = i === currentStep
          
          return (
            <motion.div 
              key={i}
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
              <span className={`text-sm font-medium ${isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}>
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
