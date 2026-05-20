import { Router } from "express";
import { db } from "@workspace/db";
import { userProfiles } from "@workspace/db";
import { eq } from "drizzle-orm";

const profileRouter = Router();

profileRouter.get("/profile/:profileKey", async (req, res) => {
  const { profileKey } = req.params;
  try {
    const [row] = await db.select().from(userProfiles).where(eq(userProfiles.profileKey, profileKey));
    res.json(row ?? null);
  } catch (err) {
    req.log.error({ err }, "profile GET failed");
    res.status(500).json({ error: "Failed to load profile" });
  }
});

profileRouter.put("/profile/:profileKey", async (req, res) => {
  const { profileKey } = req.params;
  const b = req.body as Record<string, string | null>;
  try {
    const values = {
      profileKey,
      displayName: b.displayName ?? "Ketika",
      avatarInitial: b.avatarInitial ?? "K",
      avatarColorFrom: b.avatarColorFrom ?? "rgba(0,212,170,0.25)",
      avatarColorTo: b.avatarColorTo ?? "rgba(59,139,235,0.25)",
      bannerColor: b.bannerColor ?? "#070a10",
      engine: b.engine ?? "groq",
      themeName: b.themeName ?? "custom",
      customAccent: b.customAccent ?? "#00d4aa",
      avatarImageUrl: b.avatarImageUrl ?? null,
      bannerImageUrl: b.bannerImageUrl ?? null,
      bgImageUrl: b.bgImageUrl ?? null,
      updatedAt: new Date(),
    };
    await db
      .insert(userProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: userProfiles.profileKey,
        set: {
          displayName: values.displayName,
          avatarInitial: values.avatarInitial,
          avatarColorFrom: values.avatarColorFrom,
          avatarColorTo: values.avatarColorTo,
          bannerColor: values.bannerColor,
          engine: values.engine,
          themeName: values.themeName,
          customAccent: values.customAccent,
          avatarImageUrl: values.avatarImageUrl,
          bannerImageUrl: values.bannerImageUrl,
          bgImageUrl: values.bgImageUrl,
          updatedAt: values.updatedAt,
        },
      });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "profile PUT failed");
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default profileRouter;
