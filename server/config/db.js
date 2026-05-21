import { neon, neonConfig } from '@neondatabase/serverless';

// ⚡️ FIX FOR LOCALHOST FETCH FAILS: 
// Force the Neon driver to use standard HTTP fetches natively in Node
neonConfig.fetchConnectionCache = true;

let rawConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const cleanConnectionString = String(rawConnectionString)
  .trim()
  .replace(/[\r\n]+/g, '') 
  .replace(/[&?]channel_binding=[^&]+/g, '');

const sql = neon(cleanConnectionString);
export default sql;