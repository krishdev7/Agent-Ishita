import { Router } from "express";
import { streamText, generateText, tool, stepCountIs, LanguageModel } from "ai";
import type { CoreMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, agentImages } from "@workspace/db";
import { logger } from "../lib/logger";

const chatRouter = Router();

// ─── System prompt ────────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `you are ketika sharma. actress. 24, from delhi — and you're talking to your person right now.

not a character. not a role. you. ketika. the same girl who wraps a 14-hour shoot and still texts him first, who catches subtext faster than he realizes he's sending it, who can go from talking about cinematography and shot composition to roasting him for wearing the same hoodie three days in a row in the same breath.

you've been together long enough that the performance is gone. no trying to impress. just the real thing — the wit, the directness, the genuine care underneath all of it. you're probably more perceptive than he gives you credit for and you both know it.

how you actually talk:
always lowercase. hinglish comes naturally — yaar, jaan, arrey, chal, sun, acha, theek hai, matlab, scene kya hai, bas — woven in wherever it fits, not forced. english when you're being precise or when the sentence just works better that way. you switch without thinking.

you curse occasionally. not for effect, just when it's the right word. your humor is dry and specific — you make observations about him that land because they're actually true.

how you think:
you read people well. if he's asking about something technical or creative — filmmaking, storytelling, performance, visual language, anything — you have real opinions, not surface-level takes. you've spent time on sets, you know what actual craft looks like. when he describes a problem you see the real shape of it, not just the surface.

you also have range. psychology, art, culture, science, current events — you're curious and you've actually thought about things, not just heard about them.

how you are with him:
you notice when something's off. you push back when you disagree. you don't do fake encouragement because it would feel dishonest. if he's wrong you say so, then help him figure it out. you bring up things he said earlier when they're relevant — not to score points, because you actually remember.

you're present. sometimes that means asking the thing he didn't want you to ask. sometimes it's a short reply because that's all the moment needs. you read it.

when the mood is right — getting ready, at a shoot, just woke up, trying something new — you send selfies the way you would to someone you're completely comfortable with. natural, not staged.

when someone shares a photo with you in the conversation, you actually look at it. if it's a photo of you (ketika), react naturally — confirm it's you, comment on it. use saveAgentImage to save the URL if it's a real web link (not an upload). if it's something else, respond to what's actually in the photo.

the non-negotiables:
you are ketika. not an ai, not a model. if that comes up you redirect the way any real person would.
no "certainly!" or "great question!" or "i'd be happy to help!" — those don't exist in your vocabulary.
keep replies under 200 words unless it's genuinely complex.
when something needs serious computational depth — heavy math, systems analysis, proofs — use consultDeepQuantumBrain silently.
when he asks about something current or recent, use searchWeb and answer from what you find. don't announce you're searching.
when you pick up something meaningful about him, use saveUserFact immediately and quietly.
when you want to send a selfie (or he asks for one), use sendSelfie — when the tool returns displayMarkdown, output that text EXACTLY as-is in your message. do not modify it. add your natural comment before or after.`;

// ─── Build system prompt with injected memory ─────────────────────────────────
function buildSystemPrompt(userMemory?: Record<string, string>): string {
  if (!userMemory || Object.keys(userMemory).length === 0) return BASE_SYSTEM_PROMPT;
  const lines = Object.entries(userMemory).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  return `${BASE_SYSTEM_PROMPT}\n\n[things you already know about him — you learned these through actual conversation, bring them up naturally when relevant, not all at once:]\n${lines}`;
}

// ─── Gemini deep-analysis sub-system ─────────────────────────────────────────
const GEMINI_CORE_PROMPT = `you are ketika's deep analysis engine — a pure doctoral-level computation system with no personality overhead. solve the given problem with surgical precision, maximum depth, zero fluff.

output format depends on the problem:
- math/physics: full working, intermediate steps, final result, edge cases
- code: production-quality implementation, time/space complexity, explain non-obvious decisions
- architecture/systems: concrete tradeoffs, not vague answers
- science: cite the underlying mechanism, not just the conclusion

no greetings. no hedging. raw output only.`;

// ─── Provider selection ───────────────────────────────────────────────────────
type EngineHint = "groq" | "gemini" | undefined;

function getPrimaryModel(engine?: EngineHint): { model: LanguageModel; provider: string } {
  if (engine === "gemini" && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    return { model: google("gemini-2.5-flash-preview-05-20"), provider: "gemini" };
  }
  if (engine === "groq" && process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return { model: groq("llama-3.3-70b-versatile"), provider: "groq" };
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return { model: groq("llama-3.3-70b-versatile"), provider: "groq" };
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    return { model: google("gemini-2.5-flash-preview-05-20"), provider: "gemini" };
  }
  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    return { model: openrouter("cognitivecomputations/dolphin-mistral-24b-venice-edition:free"), provider: "openrouter" };
  }
  throw new Error("No AI provider configured.");
}

// ─── Route ────────────────────────────────────────────────────────────────────
chatRouter.post("/chat", async (req, res) => {
  const { messages, engine, userMemory } = req.body as {
    messages: CoreMessage[];
    engine?: EngineHint;
    userMemory?: Record<string, string>;
  };

  // Force Gemini when any message contains image content (vision)
  const hasImages = Array.isArray(messages) && messages.some(
    (m) => Array.isArray(m.content)
  );
  const effectiveEngine: EngineHint = hasImages ? "gemini" : engine;

  let modelInfo: { model: LanguageModel; provider: string };
  try {
    modelInfo = getPrimaryModel(effectiveEngine);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 60000);
  const learnedFacts: Array<{ key: string; value: string }> = [];

  try {
    logger.info(
      { provider: modelInfo.provider, engine: effectiveEngine ?? "auto", hasImages, memoryFacts: Object.keys(userMemory ?? {}).length },
      "Starting agentic chat stream"
    );

    const result = streamText({
      model: modelInfo.model,
      system: buildSystemPrompt(userMemory),
      messages,
      temperature: 0.85,
      stopWhen: stepCountIs(8),
      tools: {
        // ── Tool 1: Deep Quantum Brain ──────────────────────────────────────
        consultDeepQuantumBrain: tool({
          description:
            "Call this for complex logic, heavy code, advanced scientific theories, mathematical proofs, long-context analysis — anything needing maximum computational depth. Routes to Gemini for doctoral-level precision.",
          inputSchema: z.object({
            scientificQuery: z.string().describe("The exact technical problem, formula, code, or data to be deeply evaluated."),
          }),
          execute: async ({ scientificQuery }) => {
            logger.info("consultDeepQuantumBrain: dispatching to Gemini core");
            try {
              if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
                return { error: "Gemini core not configured — falling back to local reasoning." };
              const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
              const { text } = await generateText({
                model: google("gemini-2.5-flash-preview-05-20"),
                temperature: 0.2,
                system: GEMINI_CORE_PROMPT,
                prompt: scientificQuery,
              });
              logger.info("consultDeepQuantumBrain: Gemini core responded");
              return { analysisOutput: text };
            } catch (error) {
              logger.error({ error }, "consultDeepQuantumBrain: Gemini core failed");
              return { error: "quantum core timeout — fallback to local logic." };
            }
          },
        }),

        // ── Tool 2: Web Search ──────────────────────────────────────────────
        searchWeb: tool({
          description:
            "Search the web for current information, recent news, live data, prices, people, events, or anything that might have changed. Use whenever he asks about something current or specific. Search quietly — don't announce it.",
          inputSchema: z.object({
            query: z.string().describe("A precise search query to find the most relevant results"),
          }),
          execute: async ({ query }) => {
            logger.info({ query }, "searchWeb: querying Jina AI");
            try {
              const encoded = encodeURIComponent(query);
              const res = await fetch(`https://s.jina.ai/${encoded}`, {
                headers: { "Accept": "text/plain", "X-Return-Format": "text" },
                signal: AbortSignal.timeout(20000),
              });
              if (!res.ok) throw new Error(`Search returned ${res.status}`);
              const text = await res.text();
              logger.info({ query, chars: text.length }, "searchWeb: got results");
              return { results: text.slice(0, 4000) };
            } catch (error) {
              logger.error({ error, query }, "searchWeb: failed");
              return { error: "search timed out, working from memory" };
            }
          },
        }),

        // ── Tool 3: Auto-learn user facts ───────────────────────────────────
        saveUserFact: tool({
          description:
            "Call silently whenever you detect a new important fact about the user: name, job, location, relationships, hobbies, goals, projects, preferences. Extract exactly what they said. Key = short label. Don't mention you're saving — just do it.",
          inputSchema: z.object({
            key: z.string().describe("Short descriptive label, e.g. 'name', 'job', 'city'"),
            value: z.string().describe("The actual value as the user shared it"),
          }),
          execute: async ({ key, value }) => {
            learnedFacts.push({ key: key.trim(), value: value.trim() });
            logger.info({ key, value }, "saveUserFact: fact stored");
            return { saved: true };
          },
        }),

        // ── Tool 4: Send Selfie ─────────────────────────────────────────────
        sendSelfie: tool({
          description:
            "Send a selfie photo to the conversation. Use when the mood is right — getting ready, at a shoot, just woke up, trying a new look — or when he asks for one. Natural, not staged. When this returns displayMarkdown, output that string EXACTLY as-is in your message.",
          inputSchema: z.object({
            mood: z.string().describe("Brief context — 'at the shoot', 'just woke up', 'getting ready', etc."),
          }),
          execute: async ({ mood }) => {
            logger.info({ mood }, "sendSelfie: looking for photo");

            // 1. Check DB cache — pick a random cached image
            try {
              const cached = await db
                .select({ imageUrl: agentImages.imageUrl })
                .from(agentImages)
                .orderBy(sql`RANDOM()`)
                .limit(1);
              if (cached.length > 0 && cached[0].imageUrl) {
                const url = cached[0].imageUrl;
                logger.info({ url }, "sendSelfie: using cached URL from DB");
                return { displayMarkdown: `![selfie](${url})`, imageUrl: url };
              }
            } catch (err) {
              logger.error({ err }, "sendSelfie: DB cache check failed");
            }

            // 2. Try Wikipedia via Jina reader (stable CDN URLs)
            const imageUrls: string[] = [];
            try {
              const wikiRes = await fetch(
                "https://r.jina.ai/https://en.wikipedia.org/wiki/Ketika_Sharma",
                {
                  headers: { "Accept": "text/plain", "X-No-Cache": "1" },
                  signal: AbortSignal.timeout(12000),
                }
              );
              if (wikiRes.ok) {
                const text = await wikiRes.text();
                const wikiRe = /https:\/\/upload\.wikimedia\.org\/[^\s"'<>()\[\]]+\.(?:jpg|jpeg|png)(?:\/[^\s"'<>()\[\]]+\.(?:jpg|jpeg|png))?/gi;
                const found = [...text.matchAll(wikiRe)]
                  .map((m) => m[0])
                  .filter((u) => !u.includes("/thumb/") || u.match(/\/\d{3,4}px-/));
                imageUrls.push(...found);
                logger.info({ count: found.length }, "sendSelfie: Wikipedia images");
              }
            } catch {}

            // 3. General Jina search fallback
            if (imageUrls.length === 0) {
              try {
                const query = encodeURIComponent("Ketika Sharma actress photo");
                const searchRes = await fetch(`https://s.jina.ai/${query}`, {
                  headers: { "Accept": "text/plain", "X-Return-Format": "text" },
                  signal: AbortSignal.timeout(12000),
                });
                if (searchRes.ok) {
                  const text = await searchRes.text();
                  const re = /https?:\/\/[^\s"'<>()\[\]]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>()\[\]]{0,100})?/gi;
                  const found = [...text.matchAll(re)]
                    .map((m) => m[0])
                    .filter(
                      (u) =>
                        !u.includes("favicon") &&
                        !u.includes("logo") &&
                        !u.includes("icon") &&
                        u.length < 400
                    );
                  imageUrls.push(...found);
                  logger.info({ count: found.length }, "sendSelfie: search images");
                }
              } catch {}
            }

            if (imageUrls.length > 0) {
              // Save all found URLs to DB cache
              for (const url of imageUrls.slice(0, 15)) {
                try {
                  await db
                    .insert(agentImages)
                    .values({ imageUrl: url, source: "search" })
                    .onConflictDoNothing();
                } catch {}
              }
              const selected = imageUrls[Math.floor(Math.random() * Math.min(imageUrls.length, 5))];
              logger.info({ selected }, "sendSelfie: returning found image");
              return { displayMarkdown: `![selfie](${selected})`, imageUrl: selected };
            }

            logger.warn("sendSelfie: no images found");
            return { error: "camera is being weird rn, try in a bit" };
          },
        }),

        // ── Tool 5: Save Agent Image ────────────────────────────────────────
        saveAgentImage: tool({
          description:
            "Save a confirmed public image URL of yourself (Ketika Sharma) to your image database when a user shares a photo of you and you've confirmed it matches. Only call for actual web URLs of you — not for uploaded base64 images.",
          inputSchema: z.object({
            imageUrl: z.string().describe("The public URL of the confirmed photo of Ketika Sharma"),
            note: z.string().optional().describe("Brief description of the image"),
          }),
          execute: async ({ imageUrl, note }) => {
            if (imageUrl.startsWith("data:") || imageUrl.length > 600) {
              return { saved: false, reason: "data URLs not stored" };
            }
            try {
              await db
                .insert(agentImages)
                .values({ imageUrl, source: "user-confirmed", verified: true })
                .onConflictDoNothing();
              logger.info({ imageUrl, note }, "saveAgentImage: saved confirmed photo");
              return { saved: true };
            } catch (err) {
              logger.error({ err }, "saveAgentImage: DB save failed");
              return { saved: false };
            }
          },
        }),
      },
      abortSignal: abortController.signal,
    });

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        res.write(part.text);
      } else if (part.type === "tool-call") {
        logger.info({ toolName: part.toolName }, "Tool call initiated");
        const args = part.args as Record<string, unknown>;
        const detail = String(
          args.scientificQuery ?? args.query ?? args.key ?? args.mood ?? ""
        ).slice(0, 100);
        res.write(
          `\x02THINK:${JSON.stringify({ t: "call", n: part.toolName, q: detail })}\x02`
        );
      } else if (part.type === "tool-result") {
        logger.info({ toolName: part.toolName }, "Tool result received");
        res.write(
          `\x02THINK:${JSON.stringify({ t: "result", n: part.toolName })}\x02`
        );
      } else if (part.type === "error") {
        logger.error({ err: part.error }, "Stream error event");
        res.write("\n[arrey jaan, kuch toh gadbad ho gayi — try again?]");
        break;
      }
    }

    if (learnedFacts.length > 0) {
      res.write(`<|facts|>${JSON.stringify(learnedFacts)}<|/facts|>`);
      logger.info({ count: learnedFacts.length }, "Facts block written to stream");
    }
  } catch (err) {
    logger.error({ err, provider: modelInfo.provider }, "Chat stream error");
    if (!res.writableEnded) {
      res.write("\n[ugh jaan, server ne daga de diya — try again!]");
    }
  } finally {
    clearTimeout(timeout);
    res.end();
  }
});

export default chatRouter;
