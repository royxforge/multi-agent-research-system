# Changelog

All notable changes to Auto-Researcher are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Research queue — clicking multiple trending topics queues them sequentially instead of running in parallel
- Loading skeletons for trending topics chips (pulse-animated placeholders)
- Manual refresh button for trending topics (bypasses localStorage cache)
- Toast notifications when a trending topic auto-starts or is queued
- Auto-start research from URL (`/app?topic=X&auto=1`)
- Theme-aware favicon swap — sidebar toggle dynamically updates the favicon `<link>` in real-time
- `apple-touch-icon` (180×180 SVG) for iOS home screen, also theme-aware
- Brand icon component (`BrandIcon` / `BrandMark`) — consistent document-on-gradient SVG across sidebar, favicon, and iOS icon
- Dark-mode favicon variant with dark background + warm light document + indigo lines

### Changed
- Sidebar branding: renamed from "Researcher" to "Auto-Researcher" with the new brand icon (replacing the generic Search icon)
- Sidebar subtitle: "AI-powered" → "AI-Powered" for consistency with the Welcome screen
- Trending chips now click to immediately start research (instead of just filling the input field)
- Updated `fetchTrendingTopics()` with stale-while-revalidate localStorage caching

### Fixed
- Removed stale-closure bug in `useResearch` queue gate — replaced `isLoading` state with `processingRef` for synchronous checks in the `finally` block
- Added `useCallback` import to `Welcome.tsx` (was missing, causing a TypeScript error)

---

## [0.5.0] — 2026-05-26

### Added
- Welcome page (`/`) — full marketing landing page with:
  - Animated background blobs and mouse-tracking ambient glow
  - "AI-Powered Research Assistant" badge with pulsing dot
  - Hero text: "Research anything. Instantly."
  - Launch the app CTA button
  - Trending topics section with fetch + refresh from backend API
  - How It Works section — three-agent pipeline visualization with animated connecting line and particles
  - Feedback loop indicator showing the Critic → Draft revision cycle
  - Live system metrics dashboard (animated counter + jitter widget) — avg. processing time, sources per report, citation accuracy, max revision passes
  - Example report preview — real markdown rendered from `EXAMPLE_REPORT`, with scroll gradient fade and "Research this topic" link
  - Features grid (9 cards): Multi-agent pipeline, Academic search, Knowledge graph, Structured reports, 10+ LLM providers, Zero-knowledge encryption, Critique & revision, Streaming generation, Deep controls
  - Bottom CTA — "Start researching"
- React Router v7 — `BrowserRouter` with routes for `/` (Welcome) and `/app` (App)
- Collapsible sidebar — compact icon-only mode with history thumbnails and passphrase management
- Glass-card design system — backdrop blur, subtle borders, hover transitions
- `font-display: swap` on Google Fonts (Inter + JetBrains Mono)

### Changed
- Full UI redesign — warm color palette (`warm-50`/`warm-900`), gradient accents, glassmorphism, refined typography
- Background: `#0c0b0a` dark / `#faf9f7` light (more refined than previous `#121110`)
- Sidebar — moved from bottom to left side with proper layout
- Research form — integrated into the hero view
- Loading state — moved to its own view in the results area
- Report view — expanded to full-width (`max-w-[1440px]`) with proper side padding
- All icons replaced with lucide-react equivalents
- Dark/light mode accent colors refined for better contrast

### Fixed
- Error boundary — improved visual design with backdrop blur and active scale effect
- Knowledge graph — smaller dimensions to fit sidebar layout, auto-fit on mount, softer node rendering

### Removed
- Em dashes (`—`) from visible text on Welcome page (replaced with commas and hyphens)

---

## [0.4.0] — 2026-05-25

### Added
- Zero-knowledge encryption system:
  - Passphrase-based API key encryption with AES-256-GCM + PBKDF2 (600K iterations)
  - WebAuthn PRF extension for biometric unlock (fingerprint, Face ID, Windows Hello)
  - Emergency recovery codes (5-word, ~3.4×10¹⁰ combinations)
  - Recovery hint system stored in localStorage
  - Sidebar passphrase management UI with lock/unlock states
  - Biometric registration and unlock flows
  - End-to-end encryption indicator ("Encrypted" / "Unset — API keys sent in plaintext")
- Crypto utility (`src/lib/crypto.ts`) — `encryptField`, `decryptField`, `encryptWithRawKey`, `decryptWithRawKey`, `deriveKeyFromIKM` (HKDF-SHA256)
- WebAuthn utility (`src/lib/webauthn.ts`) — `registerBiometricKey`, `unlockWithBiometric` with PRF support
- Recovery word list (128 short, unambiguous English words)

### Changed
- `ResearchForm` accepts optional `encryptionPassphrase` prop
- `ResearchRequest` type includes zero-knowledge encryption fields

---

## [0.3.0] — 2026-05-24

### Added
- Trending topics endpoint (`GET /trending`) on the backend
- `fetchTrendingTopics()` API client function
- Trending topics chips on the main page with fallback topics
- Real-time agent state streaming via SSE (`/research/stream`)
- `useResearch` hook with streaming support, progress events, and token events
- `LoadingState` component with live agent progress dashboard
- Research history — persisted to localStorage (last 50 items)
- History sidebar with relative timestamps (via `date-fns`)
- "New chat" button to reset state
- Custom scrollbar styles

### Changed
- Research flow switched from polling to SSE streaming
- `executeResearch` now uses `ReadableStream` to consume SSE events
- Error handling improved with `AbortController` for stop functionality

---

## [0.2.0] — 2026-05-23

### Added
- Visual Knowledge Graph — interactive force-directed graph of cited papers using `react-force-graph-2d`
- Node painting with hover glow, topic root highlight, and label display
- Graph data extraction in the backend agent pipeline
- PDF download and parsing with PyMuPDF (Fitz)
- Source ranking tool with configurable thresholds
- Citation validation tool
- Configurable critic strictness (Lenient / Balanced / Strict)
- FastAPI CORS middleware for frontend integration

### Changed
- Agent pipeline extended to extract knowledge graph relationships
- Research response includes `graph_data` with nodes and links

---

## [0.1.0] — 2026-05-22

### Added
- Initial multi-agent system with LangGraph:
  - Research Agent — parallel Tavily + DuckDuckGo search, academic filtering
  - Draft Agent — high-density synthesis (2400+ words)
  - Critic Agent — fact-checking, hallucination detection, feedback loop
- Hybrid Engine: local Ollama mode + cloud OpenRouter mode
- FastAPI backend with `/research` endpoint
- React 19 + Vite frontend with basic form and report viewer
- React Markdown rendering for drafts
- Dark mode support
- Basic research depth and source count controls
- Server-Sent Events foundation
