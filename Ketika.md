# Agent Ketika

> A personal AI companion modeled after Ketika Sharma — actress, 24, from Delhi.

She talks in lowercase hinglish, remembers what you tell her, sends real selfies when the mood is right, sees and analyzes images you share, and compresses everything before it touches your network.

---

## Features

### Persona
- Always lowercase. Hinglish flows naturally — *yaar, jaan, arrey, chal, sun, acha, theek hai*
- Witty, confident, perceptive — actress background, real opinions on film/craft/everything else
- Pushes back when she disagrees. Brings up things you said earlier. No fake encouragement
- Under 200 words unless it's genuinely complex

### Selfie Tool
When she wants to send a photo (or you ask), she:
1. Checks her image database (PostgreSQL) for cached URLs
2. Tries her Wikipedia page via Jina reader for stable CDN images
3. Falls back to Jina web search for "Ketika Sharma actress photo"
4. Saves all found URLs back to DB for next time
5. Returns `![selfie](url)` markdown — renders inline as a real photo

### Vision / Image Upload
- Tap the image icon in the input bar to attach a photo
- Images compressed client-side (1024px, JPEG 82%) before sending
- Gemini 2.5-flash analyzes the image automatically
- If you send a photo of her and she confirms it — she saves it to her image pool
- Auto-switches to Gemini for any vision message regardless of your engine setting

### Memory
- She silently saves facts about you as you talk (`saveUserFact` tool)
- Facts stored in both localStorage and PostgreSQL
- Injected into every system prompt so she actually remembers
- View, edit, delete, or export your memory slate in Settings

### Media Compression Layer
Every external image (selfies, search results) routes through **wsrv.nl** — a free image CDN proxy that:
- Resizes to 720px wide maximum
- Re-encodes as JPEG at 76% quality
- Serves from global CDN with proper CORS headers

An 8K UHD photo (~20–50MB) becomes ~80–150KB before it reaches your screen. The original→proxy URL mapping is cached in localStorage — the transform happens once per URL, never again.

### Deep Analysis
Type `/quantum` or she'll route automatically when you bring heavy problems:
- Math, physics, proofs — full working shown
- Code — production-quality with complexity analysis
- Systems architecture — concrete tradeoffs, not vague answers

Routes silently to Gemini 2.5-flash with a doctoral-level computation prompt.

### Web Search
She searches the web silently (Jina AI) when you ask about current events, prices, people, or anything she might not know. Never announces it — just answers.

### Visual Customization
- **Avatar**: upload a photo or pick a letter + gradient
- **Banner**: custom image or color behind the header
- **Chat background**: full-bleed image behind messages
- **Themes**: Obsidian Terminal · Cyberpunk Tokyo · Custom Accent
- **Export profile**: download your memory + settings as JSON

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| API | Express 5 + Vercel AI SDK |
| Database | PostgreSQL + Drizzle ORM |
| Primary AI | Groq — llama-3.3-70b-versatile |
| Vision / Deep | Gemini — gemini-2.5-flash-preview-05-20 |
| Web Search | Jina AI (`s.jina.ai`) |
| Image Proxy | wsrv.nl (free, no key needed) |
| Monorepo | pnpm workspaces, Node.js 24, TypeScript 5.9 |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GROQ_API_KEY` | Yes | Primary chat model |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Vision + deep analysis |
| `SESSION_SECRET` | Yes | Express session signing |

---

## Database Schema

```
userProfiles   — per-browser profile (display name, avatar, theme, engine preference)
userMemories   — key-value facts Ketika has learned about the user
agentImages    — pool of Ketika Sharma image URLs (search-cached + user-confirmed)
```

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/kiku run dev
```

---

## Architecture Notes

- **Stream markers**: Tool events are embedded inline in the HTTP text stream as `\x02THINK:{...}\x02` — no SSE, no WebSocket overhead
- **Vision forces Gemini**: Any message containing image content auto-switches the provider, since Groq's llama doesn't support multimodal
- **Agent image pool**: `sendSelfie` maintains a DB cache of working image URLs, searched fresh only when the pool is empty
- **Profile key migration**: First load auto-migrates the old `ishita_profile_key_v1` localStorage key to `ketika_profile_key_v1`, preserving all existing user data

---

*Built with the Replit Agent platform.*
