import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const serversTable = sqliteTable('servers', {
  id: int().primaryKey({ autoIncrement: true }),
  server_id: text().notNull(),
  channel_id: text().notNull(),
});
