#!/usr/bin/env node
/**
 * Apply RLS policies for dictionary tables
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
  console.error('❌ VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не найдены в .env');
  process.exit(1);
}

console.log('🔧 Применение RLS политик для справочников...\n');
console.log('━'.repeat(80));

// Read migration SQL
const sqlFilePath = join(__dirname, 'supabase', 'migrations', '1768510000_fix_rls_policies_dictionaries.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('\n📄 Содержимое миграции:');
console.log('━'.repeat(80));
console.log(sqlContent);
console.log('━'.repeat(80));

console.log('\n⚠️  ВАЖНО: Этот скрипт НЕ может выполнить DDL команды через REST API.');
console.log('   Суп абаse не поддерживает выполнение произвольного SQL через REST API.\n');

console.log('📋 ИНСТРУКЦИЯ ДЛЯ РУЧНОГО ПРИМЕНЕНИЯ:\n');
console.log('   1. Откройте Supabase Dashboard: https://supabase.com/dashboard');
console.log('   2. Перейдите в ваш проект');
console.log('   3. Откройте SQL Editor (слева в меню)');
console.log('   4. Скопируйте содержимое файла:');
console.log(`      ${sqlFilePath}`);
console.log('   5. Вставьте SQL в редактор');
console.log('   6. Нажмите "Run" для выполнения\n');

console.log('✨ После выполнения миграции справочники начнут сохраняться!\n');

// Test if we can at least read from tables
console.log('🔍 Проверка доступности таблиц справочников:\n');

const tables = [
  'container_types',
  'process_templates',
  'process_template_steps',
  'locations',
  'equipment',
  'media_recipes'
];

for (const table of tables) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log(`   ✅ ${table} - доступна для чтения`);
    } else {
      const error = await response.text();
      console.log(`   ❌ ${table} - ошибка: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ ${table} - ошибка: ${error.message}`);
  }
}

console.log('\n' + '━'.repeat(80));
console.log('\n💡 Если таблицы доступны для чтения, но не сохраняются данные,');
console.log('   значит RLS политики для INSERT/UPDATE не настроены.');
console.log('   Выполните миграцию вручную по инструкции выше.\n');
