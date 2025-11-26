export type ResearchRequest = {
  topic: string
  max_depth: number
  num_papers: number
  provider: string
  openrouter_api_key?: string
  model?: string
  critic_strictness?: number
}

export type ResearchResponse = {
  final_report: string
  sources: string[]
  topic: string
}
