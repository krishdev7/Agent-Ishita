# Agent Ketika

A personal AI companion modeled after Ketika Sharma — actress, 24, from Delhi. She talks in lowercase hinglish, remembers what you tell her, sends selfies via real image search, analyzes photos you share with her (Gemini vision), and compresses all images before they hit your network.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/kiku run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, never on prod)
- Required env: `DATABASE_URL`, `GROQ_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (`artifacts/kiku`)
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM
- AI: Vercel AI SDK — Groq (llama-3.3-70b) + Gemini 2.5-flash (multimodal/vision)
- Image compression: wsrv.nl CDN proxy + canvas-based upload compression

## Where things live

- `artifacts/kiku/src/hooks/use-kiku-chat.ts` — core streaming hook, image/vision support, history
- `artifacts/kiku/src/contexts/` — UserConfig, Memory, Theme contexts
- `artifacts/kiku/src/components/chat/` — ChatInterface, MessageBubble (CachedImage), ChatInput (image picker)
- `artifacts/kiku/src/lib/imageCache.ts` — wsrv.nl proxy URL builder + localStorage cache
- `artifacts/kiku/src/lib/imageUtils.ts` — canvas-based JPEG compression for uploads
- `artifacts/kiku/src/lib/profileKey.ts` — UUID-based profile key (migrates old key automatically)
- `artifacts/api-server/src/routes/chat.ts` — AI streaming route with all 5 tools
- `lib/db/src/schema/index.ts` — DB schema: userProfiles, userMemories, agentImages

## Architecture decisions

- **Dual AI model**: Groq for fast day-to-day chat; Gemini for vision + deep analysis. Vision auto-forces Gemini regardless of user's engine setting — Groq doesn't support multimodal.
- **Inline stream markers**: Tool call events embedded in the text stream as `\x02THINK:{...}\x02` blocks. No SSE, no WebSocket — single HTTP stream carries everything.
- **Image compression two layers**: Uploads compressed client-side via canvas before sending (1024px, 82% JPEG); external images (selfies) compressed at display time via wsrv.nl proxy (720px, 76% JPEG).
- **Agent image pool**: `agentImages` table caches selfie URLs found via Wikipedia/Jina search. sendSelfie pulls from DB first (random), searches live only when cache is cold.
- **localStorage + DB dual caching**: Profile/config in localStorage (fast) + DB (cross-device). Selfie URLs in localStorage. Image proxy URL mappings in localStorage. Facts in both.

## Product

- Natural girlfriend persona: actress, lowercase hinglish, real opinions, no corporate filler
- `sendSelfie` tool: fetches Ketika Sharma images via Wikipedia/Jina, caches in DB, returns inline markdown photo
- `saveAgentImage` tool: saves confirmed photos of herself (from user shares) to her image DB
- `saveUserFact` tool: silently learns facts about the user, persists to DB
- `searchWeb` tool: Jina AI search, used quietly for current events
- `consultDeepQuantumBrain` tool: routes heavy math/code/reasoning to Gemini 2.5-flash
- Vision: attach images from input — Gemini analyzes them; she reacts naturally and saves confirmed photos of herself
- Persistent memory: facts saved to both localStorage and PostgreSQL, injected into every system prompt
- Media compression: wsrv.nl shrinks 8K UHD photos to ~720px JPEG at display time (100x+ data saving)
- Full visual customization: avatar image/initial/gradient, banner, chat background (upload or URL, all compressed)
- Theme engine: Obsidian Terminal, Cyberpunk Tokyo, Custom Accent
- Export/import profile as JSON

## User preferences

- Agent persona: Ketika Sharma, actress, 24, Delhi — always lowercase hinglish
- Image compression targets: 720px JPEG 76% for display (wsrv.nl); 1024px JPEG 82% for uploads
- `sendSelfie` searches Wikipedia CDN first (stable URLs), then Jina general search
- Always use Gemini for vision; force-switch regardless of engine setting
- Max 8 tool steps per turn (stepCountIs(8))
- No emoji in code or responses unless user explicitly asks

## Gotchas

- **Never run `pnpm dev` at workspace root** — artifacts need env vars wired by their individual workflows
- **Run DB push after schema changes**: `pnpm --filter @workspace/db run push`
- **profileKey migration**: `profileKey.ts` auto-migrates `ishita_profile_key_v1` → `ketika_profile_key_v1` on first load, preserving existing user UUID
- **wsrv.nl proxy**: if proxy is unreachable, `CachedImage` falls back to original URL automatically
- **Vision forces Gemini**: any message with array content triggers provider switch; Groq's llama doesn't support images

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema source of truth: `lib/db/src/schema/index.ts`
- AI tools source of truth: `artifacts/api-server/src/routes/chat.ts`
