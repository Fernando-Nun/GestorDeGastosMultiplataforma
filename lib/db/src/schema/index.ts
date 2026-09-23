import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSessions = pgTable("app_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("app_sessions_token_hash_idx").on(t.tokenHash),
  index("app_sessions_user_id_idx").on(t.userId),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  serviceName: text("service_name").notNull(),
  paymentDay: integer("payment_day").notNull(),
  cardLabel: text("card_label"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("expenses_user_payment_day_idx").on(t.userId, t.paymentDay),
  check("expenses_service_name_check", sql`length(trim(${t.serviceName})) > 0`),
  check("expenses_payment_day_check", sql`${t.paymentDay} between 1 and 31`),
  check("expenses_amount_check", sql`${t.amount} > 0`),
  check("expenses_currency_check", sql`${t.currency} in ('MXN', 'USD')`),
]);