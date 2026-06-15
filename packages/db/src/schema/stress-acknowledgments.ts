import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stressDownloadAcknowledgments = sqliteTable(
  "stress_download_acknowledgments",
  {
    userId: text("user_id").primaryKey(),
    patientAcknowledgedAt: text("patient_acknowledged_at"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  }
);

export type StressDownloadAcknowledgment =
  typeof stressDownloadAcknowledgments.$inferSelect;
export type NewStressDownloadAcknowledgement =
  typeof stressDownloadAcknowledgments.$inferInsert;
