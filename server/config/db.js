import { neon } from '@neondatabase/serverless';

// 1. Fetch your string from either environment slot safely
let rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!rawConnectionString) {
  console.error("❌ DATABASE ERROR: No connection string found inside environment variables!");
}

// 2. Clear any hidden structural formatting or whitespace anomalies
// .trim() removes hidden spaces/newlines, .replace removes advanced TCP-only flags
const cleanConnectionString = String(rawConnectionString)
  .trim()
  .replace(/[\r\n]+/g, '') 
  .replace(/[&?]channel_binding=[^&]+/g, '');

// 3. Initialize your clean SQL query client
const sql = neon(cleanConnectionString);

export default sql;