import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const waAccounts = pgTable("wa_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientRef: text("client_ref").notNull(),
  phoneNumberId: text("phone_number_id").notNull(),
  wabaId: text("waba_id").notNull(),
  accessTokenEnc: text("access_token_enc").notNull(),
  displayName: text("display_name"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const waApiKeys = pgTable("wa_api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientRef: text("client_ref").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  revokedAt: timestamp("revoked_at"),
});

export const waMessages = pgTable("wa_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientRef: text("client_ref").notNull(),
  toPhone: text("to_phone").notNull(),
  type: text("type").notNull(),
  templateName: text("template_name"),
  payload: jsonb("payload"),
  waMessageId: text("wa_message_id"),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  dedupeKey: text("dedupe_key"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const waTemplates = pgTable("wa_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientRef: text("client_ref").notNull(),
  name: text("name").notNull(),
  language: text("language").notNull().default("es_MX"),
  category: text("category").notNull().default("utility"),
  status: text("status").notNull().default("approved"),
  body: text("body"),
  variables: jsonb("variables"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});
