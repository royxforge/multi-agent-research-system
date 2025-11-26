import { Sidebar } from './components/Sidebar'
import { ResearchForm } from './components/ResearchForm'
import { ReportView } from './components/ReportView'
import { LoadingState } from './components/LoadingState'
import { useResearch } from './hooks/useResearch'
import { AlertCircle, Sparkles, Brain, Database, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const { 
    isLoading, 
    error, 
    currentResult, 
    history, 
    executeResearch, 
    clearHistory,
    setCurrentResult 
  } = useResearch()

  const handleResearch = (topic: string, depth: number, numPapers: number, provider: string, apiKey?: string, model?: string, strictness?: number) => {
    executeResearch({ 
      topic, 
      max_depth: depth, 
      num_papers: numPapers,
      provider,
      openrouter_api_key: apiKey,
      model,
      critic_strictness: strictness
    })
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 overflow-hidden selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        history={history} 
        onSelect={setCurrentResult} 
        onClear={clearHistory} 
        onNewChat={() => setCurrentResult(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Gradient Line */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 opacity-50" />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
            
            <AnimatePresence mode="wait">
              {!currentResult && !isLoading ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col justify-center items-center text-center space-y-8 min-h-[60vh]"
                >
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  
                  <div className="space-y-4 max-w-lg">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                      What do you want to know?
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">
                      I can research complex topics, read academic papers, and summarize findings for you.
                    </p>
                  </div>

                  <div className="w-full max-w-2xl">
                    <ResearchForm onSubmit={handleResearch} isLoading={isLoading} />
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mt-12">
                    {[
                      {
                        icon: Brain,
                        title: "Deep Analysis",
                        desc: "Multi-agent system that breaks down complex topics."
                      },
                      {
                        icon: Database,
                        title: "Academic Sources",
                        desc: "Scours reputable databases for peer-reviewed papers."
                      },
                      {
                        icon: FileText,
                        title: "Comprehensive Reports",
                        desc: "Synthesizes findings into structured markdown reports."
                      }
                    ].map((feature, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                          <feature.icon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full pb-20"
                >
                  {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {isLoading ? (
                    <LoadingState />
                  ) : currentResult ? (
                    <ErrorBoundary>
                      <ReportView data={currentResult} />
                    </ErrorBoundary>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
// End of file
