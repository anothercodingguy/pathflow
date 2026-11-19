const fs = require('fs');
const path = require('path');

const schemaPostgresPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const schemaSqlitePath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const activeSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

const dbType = isPostgres ? 'PostgreSQL' : 'SQLite';
// Log only the database type. The URL contains the database user and password.
console.log(`[PathFlow DB Prep] Target Database: ${dbType}`);

if (isPostgres) {
  console.log('[PostgreSQL] Activating Prisma schema for PostgreSQL production...');
  const postgresSchema = fs.readFileSync(schemaPostgresPath, 'utf8');
  fs.writeFileSync(activeSchemaPath, postgresSchema);
} else {
  console.log('[SQLite] Activating Prisma schema for SQLite development...');
  const sqliteSchema = fs.readFileSync(schemaSqlitePath, 'utf8');
  fs.writeFileSync(activeSchemaPath, sqliteSchema);
}
