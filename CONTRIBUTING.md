# Contributing to Auto-Researcher

Thanks for your interest in contributing! 🎉 This document covers everything you need to know to get started with local development, run tests, and submit pull requests.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [Environment Configuration](#environment-configuration)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
  - [Branching](#branching)
  - [Making Changes](#making-changes)
  - [Type Checking](#type-checking)
  - [Linting](#linting)
  - [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
  - [PR Checklist](#pr-checklist)
  - [PR Description Template](#pr-description-template)
  - [Review Process](#review-process)
- [Coding Standards](#coding-standards)
  - [Python (Backend)](#python-backend)
  - [TypeScript / React (Frontend)](#typescript--react-frontend)
  - [CSS / Tailwind](#css--tailwind)
- [Feature Guidelines](#feature-guidelines)
  - [Adding New Backend Endpoints](#adding-new-backend-endpoints)
  - [Adding New Frontend Components](#adding-new-frontend-components)
  - [Encryption / Security Considerations](#encryption--security-considerations)
- [Release Process](#release-process)

---

## Code of Conduct

This project is committed to providing a welcoming, inclusive experience for everyone. By participating, you agree to:

- Be respectful and constructive in discussions
- Focus on what is best for the project and its users
- Accept constructive criticism gracefully
- Show empathy toward other contributors

Harassment, discriminatory language, or toxic behavior will not be tolerated.

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
| :--- | :--- | :--- |
| **Python** | 3.10+ | Required for the backend |
| **Node.js** | 18+ | Required for the frontend |
| **npm** | 9+ | Ships with Node.js |
| **Ollama** | Latest | Required for local LLM mode — [install guide](https://ollama.com/) |
| **Git** | Any | Version control |

Optional but recommended:

- **Tavily API key** — for better search results (free tier available)
- **OpenRouter API key** — for cloud LLM access
- **LangSmith API key** — for LLM observability and tracing

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/auto-researcher-python.git
cd auto-researcher-python

# Add the upstream remote
git remote add upstream https://github.com/royxlead/auto-researcher-python.git
```

#### Backend Setup

```bash
# Create and activate a virtual environment
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (CMD)
.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

#### Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Required for search quality
TAVILY_API_KEY=tvly-your-key-here

# Local LLM (Ollama — requires Ollama running locally)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# Cloud LLM (OpenRouter — optional, for cloud mode)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=x-ai/grok-4.1-fast

# LangSmith tracing (optional)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2-...
LANGSMITH_PROJECT=auto-researcher
```

> **Important:** Never commit your `.env` file or any real API keys to version control.

### Running the Backend

```bash
# From the project root, with the virtual environment activated
python run.py
```

The backend starts on `http://localhost:8000`. You can verify it's running:

```bash
curl http://localhost:8000/health      # Health check
curl http://localhost:8000/trending    # Trending topics (if available)
```

The API docs are available at `http://localhost:8000/docs` (Swagger UI).

### Running the Frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The frontend starts on `http://localhost:5173`. It auto-proxies API calls to the backend.

#### Optional: Override the API URL

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

---

## Project Structure

```
auto-researcher-python/
├── run.py                     # Backend entry point (uvicorn)
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (gitignored)
│
├── src/                       # Backend source
│   ├── api.py                 # FastAPI routes + SSE streaming
│   ├── config.py              # Environment configuration
│   ├── schemas.py             # Pydantic request/response models
│   ├── agents/                # LangGraph agent pipeline
│   │   ├── graph.py           # Workflow graph definition
│   │   ├── nodes.py           # Agent node functions
│   │   └── state.py           # Graph state schema
│   ├── tools/                 # Agent tools
│   │   ├── search.py          # Tavily + DuckDuckGo search
│   │   ├── pdf.py             # PDF download + parsing
│   │   ├── ranking.py         # Source relevance ranking
│   │   ├── validation.py      # Citation validation
│   │   └── graph.py           # Knowledge graph extraction
│   ├── evaluation/            # Evaluation tools
│   │   └── retrieval.py       # Retrieval evaluation
│   └── utils/                 # Utilities
│       ├── crypto.py          # Server-side crypto
│       └── tracing.py         # LangSmith tracing
│
├── frontend/                  # Frontend source
│   ├── index.html             # HTML entry point
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS v4 config
│   ├── tsconfig.json          # TypeScript configuration
│   ├── package.json           # npm dependencies
│   └── src/
│       ├── main.tsx           # React entry point + routing
│       ├── App.tsx            # Main research app (/app)
│       ├── pages/
│       │   └── Welcome.tsx    # Marketing landing page (/)
│       ├── components/        # React components
│       │   ├── Sidebar.tsx
│       │   ├── ResearchForm.tsx
│       │   ├── ReportView.tsx
│       │   ├── LoadingState.tsx
│       │   ├── KnowledgeGraph.tsx
│       │   ├── ErrorBoundary.tsx
│       │   └── BrandIcon.tsx
│       ├── hooks/
│       │   └── useResearch.ts # Research state + queue logic
│       └── lib/
│           ├── api.ts         # API client
│           ├── crypto.ts      # Client-side AES-256-GCM encryption
│           ├── webauthn.ts    # WebAuthn PRF biometric unlock
│           └── favicon.ts     # Theme-aware favicon swap
│
├── assets/                    # Screenshots for README
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

---

## Development Workflow

### Branching

| Branch | Purpose |
| :--- | :--- |
| `main` | Stable, release-ready code |
| `feat/*` | New features (e.g., `feat/pdf-export`) |
| `fix/*` | Bug fixes (e.g., `fix/trending-cache-stale`) |
| `docs/*` | Documentation-only changes |

```bash
# Create a feature branch
git checkout -b feat/my-feature

# Keep in sync with upstream
git fetch upstream
git rebase upstream/main
```

### Making Changes

1. **Start the backend** (`python run.py`) in one terminal
2. **Start the frontend** (`npm run dev`) in another terminal
3. Make your changes — the dev servers hot-reload automatically
4. Verify the feature end-to-end in the browser at `http://localhost:5173`

### Type Checking

Always run type checks before committing — they catch the majority of bugs:

```bash
# Backend (Python — Pyright or mypy)
cd backend
mypy src/

# Frontend (TypeScript)
cd frontend
npx tsc --noEmit
```

### Linting

```bash
# Backend
ruff check src/

# Frontend
cd frontend
npm run lint
```

### Testing

```bash
# Backend tests (pytest)
pytest tests/

# Run a specific test file
pytest tests/test_pdf.py

# Frontend (if tests exist)
cd frontend
npx vitest run
```

If adding new functionality, please include tests:

- **Backend**: Add tests in the `tests/` directory
- **Frontend**: Add tests alongside the component (e.g., `ResearchForm.test.tsx`)

---

## Pull Request Guidelines

### PR Checklist

Before submitting, ensure:

- [ ] Code compiles without errors (`npx tsc --noEmit`, `mypy src/`)
- [ ] Linting passes (`ruff check src/`, `npm run lint`)
- [ ] Existing tests still pass (`pytest tests/`)
- [ ] New tests are included for any new functionality
- [ ] Changes are documented in the relevant section of `README.md` or `CHANGELOG.md`
- [ ] New dependencies are justified and added to the correct file (`requirements.txt` or `package.json`)
- [ ] No `.env` files, API keys, or secrets are committed
- [ ] UI changes work in both light and dark mode
- [ ] Branch is up-to-date with `main` (rebased, not merged)

### PR Description Template

```markdown
## Description

[Brief description of the change — what it does and why]

## Related Issue

Closes #[issue-number]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactor / performance

## Screenshots (if applicable)

[Before/after screenshots for UI changes]

## Testing

[How the change was tested — what you verified]

## Checklist

- [ ] I have read the CONTRIBUTING.md document
- [ ] My code follows the project's coding standards
- [ ] I have added tests that prove my fix/feature works
- [ ] All existing tests pass
- [ ] Documentation has been updated (README, CHANGELOG)
```

### Review Process

1. **Open a draft PR** early for feedback on approach
2. **Mark as ready** when all checks pass and you believe it's complete
3. A maintainer will review within a few days
4. Address review feedback with additional commits (not force-pushes)
5. Once approved, a maintainer will merge

**Review expectations:**

- Reviewers will check for correctness, maintainability, and consistency with the codebase
- All CI checks must pass before merging
- Changes requiring significant discussion should be raised as an issue first

---

## Coding Standards

### Python (Backend)

| Rule | Standard |
| :--- | :--- |
| **Formatter** | [Ruff](https://docs.astral.sh/ruff/) (line length 100) |
| **Type hints** | Required for all function signatures |
| **Docstrings** | Google-style for all public functions and classes |
| **Error handling** | Use specific exception types; avoid bare `except:` |
| **Async** | Use `async def` for all route handlers and network I/O |
| **Models** | Use Pydantic v2 for all request/response schemas |

**Example:**

```python
async def search_papers(query: str, max_results: int = 10) -> list[PaperResult]:
    """Search academic sources for papers matching the query.

    Args:
        query: The research topic or question.
        max_results: Maximum number of papers to return.

    Returns:
        A list of PaperResult objects sorted by relevance.
    """
    ...
```

### TypeScript / React (Frontend)

| Rule | Standard |
| :--- | :--- |
| **Formatter** | Prettier (default config) |
| **TypeScript** | Strict mode; avoid `any` |
| **Components** | Functional components with hooks; no class components |
| **Imports** | Named exports for components; default exports for pages |
| **State management** | `useState` / `useCallback` / `useRef`; no external state libraries |
| **CSS** | Tailwind utility classes (avoid inline styles except for dynamic values) |
| **File naming** | PascalCase for components, camelCase for utilities |

**Naming conventions:**

```
src/
  components/
    ReportView.tsx        # PascalCase — component file
    KnowledgeGraph.tsx
  hooks/
    useResearch.ts        # camelCase — hook file
  lib/
    api.ts                # camelCase — utility module
    crypto.ts
```

**Component structure:**

```tsx
// Good — named export, typed props, functional
interface Props {
  topic: string
  onStart: (topic: string) => void
}

export function ResearchForm({ topic, onStart }: Props) {
  // Hooks at the top
  const [input, setInput] = useState(topic)

  // Handlers as useCallback where appropriate
  const handleSubmit = useCallback(() => {
    onStart(input)
  }, [input, onStart])

  return (
    // TSX with Tailwind classes
  )
}
```

### CSS / Tailwind

- Use the project's custom color palette: `warm-50` through `warm-900`, `primary-*` (indigo), `accent-*` (amber)
- Always provide both light and dark variants: `bg-white dark:bg-[#0c0b0a]`
- Use the `glass-card` utility class (defined in `index.css`) for glassmorphism surfaces
- Prefer `rem` / `px` over arbitrary values; use Tailwind's built-in spacing scale
- Animation utilities are defined in `index.css` (e.g., `animate-float-slow`, `animate-float-medium`)

---

## Feature Guidelines

### Adding New Backend Endpoints

1. Define request/response schemas in `src/schemas.py` using Pydantic
2. Add the route in `src/api.py` — prefer `async def` with proper error handling
3. If the endpoint streams data, use `StreamingResponse` with SSE format
4. Add the endpoint URL to the frontend's `src/lib/api.ts`
5. Document in `README.md` and `CHANGELOG.md`

### Adding New Frontend Components

1. Create the component in `frontend/src/components/` (PascalCase)
2. Type all props with an `interface Props`
3. Export as a named function
4. Style with Tailwind utility classes (both light + dark variants)
5. Add framer-motion animations for enter/exit transitions when appropriate
6. If the component fetches data, use `useEffect` with proper cleanup

### Encryption / Security Considerations

- All encryption happens client-side in the browser — the backend never receives the raw passphrase
- New encrypted fields must use AES-256-GCM with PBKDF2 (600K iterations)
- The WebAuthn PRF extension is used for biometric unlock — never store raw biometric data
- Recovery codes are 5-word phrases (~3.4×10¹⁰ combinations)
- Clear all sensitive localStorage keys when a user clears their biometric credential

If you're adding a new encrypted field:

1. Add encrypt/decrypt functions in `src/lib/crypto.ts`
2. Store the encrypted payload in `localStorage`
3. Add the field to the `ResearchRequest` type in `src/types.ts`
4. Pass it through in `App.tsx` → `handleResearch`

---

## Release Process

1. Update `CHANGELOG.md` with the new version and date
2. Update the version number in `package.json` (frontend)
3. Create a git tag: `git tag v0.x.x`
4. Push the tag: `git push upstream v0.x.x`
5. Build and verify the frontend: `cd frontend && npm run build`
6. Create a GitHub Release with release notes from the changelog

---

## Need Help?

- Open a [GitHub Discussion](https://github.com/royxlead/auto-researcher-python/discussions) for questions
- Open an [Issue](https://github.com/royxlead/auto-researcher-python/issues) for bug reports or feature requests
- For security vulnerabilities, email the maintainers directly — do not open a public issue
