import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { ExternalLink, FileText, BookOpen, Copy, Check, Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import type { ResearchResponse } from '../types'
import { KnowledgeGraph } from './KnowledgeGraph'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  data: ResearchResponse
}

export function ReportView({ data }: Props) {
  const [copied, setCopied] = useState(false)
  const [showGraph, setShowGraph] = useState(true)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.final_report || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([data.final_report || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'research-report.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mt-12"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-slate-200">
            <FileText className="w-5 h-5 text-indigo-400" />
            Research Report
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowGraph(!showGraph)}
              className={`flex items-center gap-2 text-sm transition-colors px-3 py-1.5 rounded-lg border ${showGraph ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Share2 className="w-4 h-4" />
              Graph
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {showGraph && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
             className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm overflow-hidden"
          >
            <ErrorBoundary>
             <KnowledgeGraph 
               topic={data.topic || "Research Topic"} 
               sources={Array.isArray(data.sources) ? data.sources : []} 
             />
            </ErrorBoundary>
          </motion.div>
        )}        <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h1:text-indigo-950 dark:prose-h1:text-indigo-100 prose-h2:text-xl prose-h2:text-indigo-900 dark:prose-h2:text-indigo-200 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500 dark:hover:prose-a:text-indigo-300 max-w-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <ReactMarkdown>{data.final_report || '*No report content available.*'}</ReactMarkdown>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-slate-200">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Sources ({(data.sources || []).length})
        </h3>
        
        <div className="space-y-3">
          {(data.sources || []).map((source, i) => (
            <motion.a
              key={i}
              href={source}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="block group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-400 transition-colors">
                  [{i + 1}]
                </span>
                <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                {source}
              </p>
            </motion.a>
          ))}
          
          {(data.sources || []).length === 0 && (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
              No sources cited
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
