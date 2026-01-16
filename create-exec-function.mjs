#!/usr/bin/env node
/**
 * Create exec RPC function in Supabase
 * This function will allow executing arbitrary SQL
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
const envContent = fs.readFileSync(join(__dirname, '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating exec function in Supabase...\n');

// SQL to create exec function
const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
`;

// Try to execute via direct table insert (won't work but let's try REST API query endpoint)
async function createFunction() {
  try {
    // Use the Supabase migration table to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'exec',
        definition: createFunctionSQL
      })
    });

    const text = await response.text();
    console.log('Response:', text);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Alternative: Just show the SQL to execute manually
console.log('📋 Execute this SQL in Supabase Dashboard -> SQL Editor:\n');
console.log('━'.repeat(80));
console.log(createFunctionSQL);
console.log('━'.repeat(80));
console.log('\n✅ After executing the above SQL, run: node apply-all-migrations.mjs');

createFunction();
