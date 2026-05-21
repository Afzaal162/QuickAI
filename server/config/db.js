import { neon } from '@neondatabase/serverless';

let rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!rawConnectionString) {
  console.error("❌ DATABASE ERROR: Missing connection string configuration setup!");
}

// Ensure the connection string points directly to the main endpoint instead of the pooled instance
const cleanConnectionString = String(rawConnectionString)
  .trim()
  .replace(/[\r\n]+/g, '')
  .replace('-pooler', ''); // Double protection: forcibly strips the pooler flag if present

const sql = neon(cleanConnectionString);

export default sql;