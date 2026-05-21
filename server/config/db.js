import { neon } from '@neondatabase/serverless';

// 1. Snag your environment string safely from your deployment profile
let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (connectionString) {
  // ⚡️ THE FIX: Strip off any advanced TCP-only flags that break the stateless Fetch API wrapper
  if (connectionString.includes('channel_binding=')) {
    // This splits at the parameter or safely strips it out completely
    connectionString = connectionString.replace(/[&?]channel_binding=[^&]+/g, '');
  }
} else {
  console.error("❌ DATABASE ERROR: No connection string found!");
}

// 2. Initialize your HTTP client driver with a clean, fetch-safe database URL
const sql = neon(connectionString);

export default sql;