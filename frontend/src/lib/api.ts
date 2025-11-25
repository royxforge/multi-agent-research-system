import type { ResearchRequest, ResearchResponse } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

export async function runResearch(payload: ResearchRequest): Promise<ResearchResponse> {
  const response = await fetch(`${API_BASE_URL}/research`, {
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
