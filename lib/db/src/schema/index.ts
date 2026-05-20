import { pgTable, serial, text, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  profileKey: text("profile_key").notNull().unique(),
  displayName: text("display_name").notNull().default("Ketika"),
  avatarInitial: text("avatar_initial").notNull().default("K"),
  avatarColorFrom: text("avatar_color_from").notNull().default("rgba(0,212,170,0.25)"),
  avatarColorTo: text("avatar_color_to").notNull().default("rgba(59,139,235,0.25)"),
  bannerColor: text("banner_color").notNull().default("#070a10"),
  engine: text("engine").notNull().default("groq"),
  themeName: text("theme_name").notNull().default("custom"),
  customAccent: text("custom_accent").notNull().default("#00d4aa"),
  avatarImageUrl: text("avatar_image_url"),
  bannerImageUrl: text("banner_image_url"),
  bgImageUrl: text("bg_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userMemories = pgTable("user_memories", {
  id: serial("id").primaryKey(),
  profileKey: text("profile_key").notNull(),
  factKey: text("fact_key").notNull(),
  value: text("value").notNull(),
  learnedAt: timestamp("learned_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("user_memories_profile_fact_idx").on(t.profileKey, t.factKey),
]);

export const agentImages = pgTable("agent_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  source: text("source").notNull().default("search"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("agent_images_url_idx").on(t.imageUrl),
]);

export type UserProfile = typeof userProfiles.$inferSelect;
export type UserMemory = typeof userMemories.$inferSelect;
export type AgentImage = typeof agentImages.$inferSelect;
