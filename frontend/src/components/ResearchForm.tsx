import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sliders, ArrowRight, Cpu, Key, Scale } from 'lucide-react'

interface Props {
  onSubmit: (topic: string, depth: number, numPapers: number, provider: string, apiKey?: string, model?: string, strictness?: number) => void
  isLoading: boolean
}

export function ResearchForm({ onSubmit, isLoading }: Props) {
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState(3)
  const [numPapers, setNumPapers] = useState(10)
  const [strictness, setStrictness] = useState(5)
  const [provider, setProvider] = useState('ollama')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim()) onSubmit(topic, depth, numPapers, provider, apiKey, model, strictness)
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="w-full space-y-6"
    >
      <div className="relative group z-10">
        {/* Animated Gradient Background */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 rounded-2xl opacity-30 group-hover:opacity-60 group-focus-within:opacity-100 transition duration-700 blur-lg" />
        
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-2 flex items-start gap-3 shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 group-focus-within:border-transparent group-focus-within:shadow-2xl group-focus-within:shadow-indigo-500/10">
          
          {/* Icon */}
          <div className="p-3 mt-1 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300">
            <Search className="w-6 h-6" />
          </div>

          {/* Input Area */}
          <div className="flex-1 py-2">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'The impact of AI on modern healthcare systems'..."
              className="w-full bg-transparent border-none text-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[60px] leading-relaxed font-medium"
              rows={2}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="self-start mt-1 p-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-indigo-500 dark:hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-100 text-white dark:text-slate-900 dark:hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {/* Depth Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>Depth: {depth}</span>
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {depth < 4 ? 'Fast' : depth < 8 ? 'Balanced' : 'Deep'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>

        {/* Papers Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Papers: {numPapers}</span>
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {numPapers < 15 ? 'Quick' : numPapers < 30 ? 'Thorough' : 'Exhaustive'}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={numPapers}
            onChange={(e) => setNumPapers(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>

        {/* Strictness Slider */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Critic Strictness: {strictness}/10</span>
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {strictness < 4 ? 'Lenient' : strictness < 8 ? 'Balanced' : 'Strict'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={strictness}
            onChange={(e) => setStrictness(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>
      </div>

      {/* Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Cpu className="w-4 h-4" />
            <span>Model Provider</span>
          </div>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value)
              // Set default models when switching providers
              if (e.target.value === 'openrouter') {
                setModel('x-ai/grok-4.1-fast')
              } else {
                setModel('llama3')
              }
            }}
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="openrouter">OpenRouter (Cloud)</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Cpu className="w-4 h-4" />
            <span>Model Name</span>
          </div>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={provider === 'openrouter' ? 'x-ai/grok-4.1-fast' : 'llama3'}
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {provider === 'openrouter' && (
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Key className="w-4 h-4" />
              <span>API Key (Optional)</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </div>
    </motion.form>
  )
}
