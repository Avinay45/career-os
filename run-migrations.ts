import * as fs from 'fs';
import { Client } from 'pg';

function loadEnvLocal() {
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const firstEq = trimmed.indexOf('=');
      if (firstEq === -1) return;
      const key = trimmed.substring(0, firstEq).trim();
      let val = trimmed.substring(firstEq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    });
  }
}

loadEnvLocal();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('✗ DATABASE_URL is not set in your .env.local file.');
  process.exit(1);
}

function getCleanConnectionString(url: string): string {
  try {
    const match = url.match(/^(postgresql:\/\/|postgres:\/\/)([^:]+):(.*?)@([^/]+)\/(.+)$/);
    if (match) {
      const proto = match[1];
      const user = match[2];
      const password = match[3];
      const host = match[4];
      const rest = match[5];
      // URL-encode the password to handle any special characters
      return `${proto}${user}:${encodeURIComponent(password)}@${host}/${rest}`;
    }
  } catch (e) {
    console.error('Failed to parse and encode connection string:', e);
  }
  return url;
}

async function runMigration() {
  const connectionString = getCleanConnectionString(dbUrl!);
  console.log('Connecting to PostgreSQL database to run migrations...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Database connected successfully.');

    if (!fs.existsSync('supabase/schema.sql')) {
      throw new Error('Could not find supabase/schema.sql file.');
    }

    const schemaSql = fs.readFileSync('supabase/schema.sql', 'utf8');
    console.log('Executing database schema.sql...');
    
    await client.query(schemaSql);
    console.log('✓ Migration executed successfully! All tables created.');
  } catch (err: any) {
    console.error('✗ Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
