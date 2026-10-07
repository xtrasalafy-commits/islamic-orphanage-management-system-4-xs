import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "pengurus"] })
    .notNull()
    .default("pengurus"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  gender: text("gender", { enum: ["L", "P"] }).notNull(),
  birthDate: date("birth_date").notNull(),
  birthPlace: varchar("birth_place", { length: 120 }),
  orphanStatus: text("orphan_status", {
    enum: ["yatim", "piatu", "yatim_piatu", "dhuafa"],
  }).notNull(),
  admissionDate: date("admission_date").notNull(),
  guardianName: varchar("guardian_name", { length: 120 }),
  guardianPhone: varchar("guardian_phone", { length: 32 }),
  address: text("address"),
  school: varchar("school", { length: 120 }),
  healthNotes: text("health_notes"),
  notes: text("notes"),
  status: text("status", { enum: ["aktif", "adopsi", "keluar", "mandiri"] })
    .notNull()
    .default("aktif"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const needs = pgTable("needs", {
  id: serial("id").primaryKey(),
  childId: integer("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["pangan", "sandang", "pendidikan", "kesehatan", "papan", "ibadah"],
  }).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull().default(0),
  needDate: date("need_date").notNull(),
  status: text("status", { enum: ["terpenuhi", "direncanakan"] })
    .notNull()
    .default("direncanakan"),
  fulfilledBy: varchar("fulfilled_by", { length: 120 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const protectionCases = pgTable("protection_cases", {
  id: serial("id").primaryKey(),
  childId: integer("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  caseType: text("case_type", {
    enum: [
      "perundungan",
      "kekerasan",
      "penelantaran",
      "kesehatan",
      "eksploitasi",
      "hak_asuh",
      "lainnya",
    ],
  }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["ringan", "sedang", "berat"] }).notNull(),
  status: text("status", {
    enum: ["terbuka", "ditangani", "selesai", "dirujuk"],
  })
    .notNull()
    .default("terbuka"),
  reportDate: date("report_date").notNull(),
  reportSource: varchar("report_source", { length: 120 }),
  handledBy: varchar("handled_by", { length: 120 }),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorName: varchar("donor_name", { length: 150 }).notNull(),
  donorType: text("donor_type", { enum: ["perorangan", "organisasi"] })
    .notNull()
    .default("perorangan"),
  category: text("category", {
    enum: ["zakat", "infak", "sedekah", "wakaf"],
  }).notNull(),
  donationType: text("donation_type", { enum: ["uang", "barang"] })
    .notNull()
    .default("uang"),
  amount: integer("amount").notNull().default(0),
  itemDescription: text("item_description"),
  donationDate: date("donation_date").notNull(),
  receivedBy: varchar("received_by", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Need = typeof needs.$inferSelect;
export type ProtectionCase = typeof protectionCases.$inferSelect;
export type Donation = typeof donations.$inferSelect;
