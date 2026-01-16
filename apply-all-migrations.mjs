#!/usr/bin/env node
/**
 * Complete migration script with service_role access
 * Executes SQL directly via Supabase PostgreSQL REST API
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Starting complete migration with service_role access...\n');
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Role Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

/**
 * Execute raw SQL via Supabase REST API
 */
async function executeSQL(sql, description = 'SQL query') {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const result = await response.text();
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error(`   ❌ Error in ${description}: ${error.message}`);
    throw error;
  }
}

/**
 * Execute migration file
 */
async function executeMigrationFile(filePath, description) {
  console.log(`📄 ${description}...`);

  try {
    const fullPath = join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      return false;
    }

    const sql = fs.readFileSync(fullPath, 'utf8');

    // Execute the entire migration as one transaction
    await executeSQL(sql, description);

    console.log(`   ✅ ${description} complete`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description} failed: ${error.message}`);
    return false;
  }
}

// =============================================================================
// Main migration flow
// =============================================================================

async function main() {
  let successCount = 0;
  let totalSteps = 3;

  // Step 1: Apply process templates migration
  console.log('━'.repeat(80));
  if (await executeMigrationFile(
    'supabase/migrations/1768500000_fix_process_templates.sql',
    'Migration 1: Process Templates with Steps'
  )) {
    successCount++;
  }

  // Step 2: Apply RLS policies migration
  console.log('\n' + '━'.repeat(80));
  if (await executeMigrationFile(
    'supabase/migrations/1768510000_fix_rls_policies_dictionaries.sql',
    'Migration 2: RLS Policies for Dictionaries'
  )) {
    successCount++;
  }

  // Step 3: Verify results
  console.log('\n' + '━'.repeat(80));
  console.log('📊 Verifying migration results...\n');

  try {
    // Count templates
    const templatesCount = await fetch(`${SUPABASE_URL}/rest/v1/process_templates?select=count&is_active=eq.true`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    }).then(r => r.headers.get('content-range')?.split('/')[1] || '0');

    // Count steps
    const stepsCount = await fetch(`${SUPABASE_URL}/rest/v1/process_template_steps?select=count`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    }).then(r => r.headers.get('content-range')?.split('/')[1] || '0');

    console.log(`   ✅ Process Templates: ${templatesCount}`);
    console.log(`   ✅ Process Steps: ${stepsCount}`);

    if (parseInt(templatesCount) >= 6 && parseInt(stepsCount) >= 50) {
      console.log(`   ✅ Verification passed!`);
      successCount++;
    } else {
      console.log(`   ⚠️  Expected at least 6 templates and 50 steps`);
    }
  } catch (error) {
    console.log(`   ⚠️  Verification error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '━'.repeat(80));
  console.log(`\n✨ Migration complete: ${successCount}/${totalSteps} steps successful\n`);

  if (successCount === totalSteps) {
    console.log('🎉 All migrations applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test process templates in the application');
    console.log('   2. Test dictionary CRUD operations (create/edit/delete)');
    console.log('   3. Test starting a process in culture detail page');
    console.log('   4. Verify that process steps are visible');
  } else {
    console.log('⚠️  Some migrations failed. Please check errors above.');
    console.log('💡 You can also apply migrations manually via Supabase Dashboard -> SQL Editor');
    process.exit(1);
  }
}

// Run main
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
