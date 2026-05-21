import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// ⚡️ THE CRUCIAL LOCALHOST FIX: 
// Assign the 'ws' library to Neon's constructor so it communicates via persistent TCP WebSockets
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("❌ DATABASE ERROR: No connection string found!");
}

// ⚡️ Switch from raw neon() to a Pool instance for WebSocket mode
const pool = new Pool({ 
  connectionString: connectionString?.trim() 
});

// Create a wrapper function to keep your exact 'sql` query syntax intact 
// so you don't have to rewrite a single line of your controllers!
const sql = async (strings, ...values) => {
  let queryText = strings[0];
  for (let i = 1; i < strings.length; i++) {
    queryText += `$${i}${strings[i]}`;
  }
  const result = await pool.query(queryText, values);
  return result.rows;
};

export default sql;