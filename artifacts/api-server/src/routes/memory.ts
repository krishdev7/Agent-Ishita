import { Router } from "express";
import { db } from "@workspace/db";
import { userMemories } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const memoryRouter = Router();

memoryRouter.get("/memory/:profileKey", async (req, res) => {
  const { profileKey } = req.params;
  try {
    const rows = await db
      .select()
      .from(userMemories)
      .where(eq(userMemories.profileKey, profileKey));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "memory GET failed");
    res.status(500).json({ error: "Failed to load memory" });
  }
});

memoryRouter.post("/memory/:profileKey", async (req, res) => {
  const { profileKey } = req.params;
  const { key, value } = req.body as { key: string; value: string };
  if (!key?.trim() || !value?.trim()) {
    res.status(400).json({ error: "key and value are required" });
    return;
  }
  try {
    await db
      .insert(userMemories)
      .values({
        profileKey,
        factKey: key.trim(),
        value: value.trim(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userMemories.profileKey, userMemories.factKey],
        set: { value: value.trim(), updatedAt: new Date() },
      });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "memory POST failed");
    res.status(500).json({ error: "Failed to save fact" });
  }
});

memoryRouter.delete("/memory/:profileKey/all", async (req, res) => {
  const { profileKey } = req.params;
  try {
    await db.delete(userMemories).where(eq(userMemories.profileKey, profileKey));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "memory clear-all failed");
    res.status(500).json({ error: "Failed to clear memory" });
  }
});

memoryRouter.delete("/memory/:profileKey/:key", async (req, res) => {
  const { profileKey } = req.params;
  const factKey = decodeURIComponent(req.params.key);
  try {
    await db
      .delete(userMemories)
      .where(
        and(
          eq(userMemories.profileKey, profileKey),
          eq(userMemories.factKey, factKey)
        )
      );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "memory DELETE failed");
    res.status(500).json({ error: "Failed to delete fact" });
  }
});

export default memoryRouter;
