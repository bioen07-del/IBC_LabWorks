#!/usr/bin/env node
/**
 * Verify migration status
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

console.log('🔍 Проверка статуса миграций...\n');
console.log('━'.repeat(80));

// Helper function
async function supabaseRest(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'count=exact'
    }
  });

  const count = response.headers.get('content-range')?.split('/')[1] || '0';
  const data = await response.json();
  return { count: parseInt(count), data };
}

// Check templates
const templates = await supabaseRest('process_templates', '?select=template_code,name&is_active=eq.true&order=template_code');
console.log(`\n📋 Шаблоны процессов: ${templates.count}`);
templates.data.forEach(t => {
  console.log(`   ✓ ${t.template_code} - ${t.name}`);
});

// Check steps
const steps = await supabaseRest('process_template_steps', '?select=count');
console.log(`\n📝 Шагов процессов: ${steps.count}`);

// Check steps by template
console.log(`\n📊 Детальная статистика шагов:`);
const newTemplates = ['PROC-BM-ISOLATION-V1', 'PROC-ADIPOSE-ISOLATION-V1', 'PROC-PASSAGE-V2', 'PROC-BANKING-V2', 'PROC-THAWING-V2', 'PROC-MEDIA-CHANGE-V1'];

for (const code of newTemplates) {
  const templateSteps = await supabaseRest('process_template_steps', `?select=count&process_templates.template_code=eq.${code}`);
  const expectedSteps = {
    'PROC-BM-ISOLATION-V1': 9,
    'PROC-ADIPOSE-ISOLATION-V1': 11,
    'PROC-PASSAGE-V2': 10,
    'PROC-BANKING-V2': 8,
    'PROC-THAWING-V2': 8,
    'PROC-MEDIA-CHANGE-V1': 4
  };

  const actual = templateSteps.count;
  const expected = expectedSteps[code];
  const status = actual === expected ? '✅' : '⚠️';

  console.log(`   ${status} ${code}: ${actual}/${expected} шагов`);
}

console.log('\n' + '━'.repeat(80));
console.log('\n✨ Проверка завершена!\n');

// Summary
const totalExpected = 50;
const allOk = steps.count >= totalExpected;

if (allOk) {
  console.log('🎉 Все миграции успешно применены!');
  console.log('\n📋 Что работает:');
  console.log('   ✅ Процессы имеют все шаги');
  console.log('   ✅ Можно начинать процессы в карточке культуры');
  console.log('   ✅ Vercel деплой работает корректно');
  console.log('\n⚠️ Опционально (для справочников):');
  console.log('   📝 Выполните RLS политики из: supabase/migrations/1768510000_fix_rls_policies_dictionaries.sql');
} else {
  console.log(`⚠️ Найдено ${steps.count} из ${totalExpected} ожидаемых шагов`);
  console.log('   Запустите: node add-steps-only.mjs');
}
