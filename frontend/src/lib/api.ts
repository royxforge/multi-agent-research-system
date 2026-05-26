import type { ResearchRequest, ResearchResponse } from '../types'

const API_BASE = () => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

const TRENDING_CACHE_KEY = 'auto-researcher-trending-topics'

function loadTrendingCache(): string[] | null {
  try {
    const cached = localStorage.getItem(TRENDING_CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return null
  } catch {
    return null
  }
}

function saveTrendingCache(topics: string[]): void {
  try {
    localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(topics))
  } catch {
    // localStorage might be full or unavailable
  }
}

async function fetchTrendingFromApi(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE()}/trending`)
    if (!response.ok) return []
    const data = (await response.json()) as { topics: string[] }
    return data.topics ?? []
  } catch {
    return []
  }
}

export async function fetchTrendingTopics(): Promise<string[]> {
  // Return cached data immediately if available
  const cached = loadTrendingCache()
  if (cached) {
    // Refresh the cache in the background for next visit
    fetchTrendingFromApi().then(fresh => {
      if (fresh.length > 0) saveTrendingCache(fresh)
    }).catch(() => {})
    return cached
  }

  // No cache — fetch fresh and cache it
  const fresh = await fetchTrendingFromApi()
  if (fresh.length > 0) saveTrendingCache(fresh)
  return fresh
}

export async function refreshTrendingTopics(): Promise<string[]> {
  // Always fetch fresh from API, bypass cache
  const fresh = await fetchTrendingFromApi()
  if (fresh.length > 0) saveTrendingCache(fresh)
  return fresh
}

export async function runResearch(payload: ResearchRequest): Promise<ResearchResponse> {
  const response = await fetch(`${API_BASE()}/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await safeParseError(response)
    throw new Error(detail ?? 'Something went wrong while running the research workflow')
  }

  return response.json() as Promise<ResearchResponse>
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { detail?: string }
    return payload.detail ?? null
  } catch (error) {
    return null
  }
}
