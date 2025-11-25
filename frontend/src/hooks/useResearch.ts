import { useState, useEffect } from 'react'
import { runResearch } from '../lib/api'
import type { ResearchRequest, ResearchResponse } from '../types'

export type HistoryItem = ResearchResponse & {
  id: string
  topic: string
  timestamp: number
  depth: number
}

export function useResearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<ResearchResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('research_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }, [])

  const saveToHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 50) // Keep last 50
    setHistory(newHistory)
    localStorage.setItem('research_history', JSON.stringify(newHistory))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('research_history')
  }

  const executeResearch = async (request: ResearchRequest) => {
    setIsLoading(true)
    setError(null)
    setCurrentResult(null)

    try {
      const response = await runResearch(request)
      setCurrentResult(response)
      
      saveToHistory({
        ...response,
        id: crypto.randomUUID(),
        topic: request.topic,
        depth: request.max_depth,
        timestamp: Date.now(),
      })
      
      return response
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    currentResult,
    history,
    executeResearch,
    clearHistory,
    setCurrentResult, // Allow setting result from history
  }
}
