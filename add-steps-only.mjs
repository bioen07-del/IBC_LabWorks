#!/usr/bin/env node
/**
 * Add steps to existing process templates
 * This script only adds steps, assumes templates already exist
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

console.log('🚀 Adding steps to existing process templates...\n');

// Helper function for Supabase REST API calls
async function supabaseRest(table, method = 'GET', body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const options = {
    method,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

// Step 1: Get existing templates
console.log('📋 Fetching existing templates...');
const templates = await supabaseRest('process_templates', 'GET', null, '?select=id,template_code&template_code=like.PROC-*');
console.log(`   ✅ Found ${templates.length} templates\n`);

// Create map of template_code -> id
const templateMap = {};
templates.forEach(t => {
  templateMap[t.template_code] = t.id;
});

// Step 2: Define all steps with ALL possible fields set
// This ensures "All object keys must match" error doesn't occur

const allStepsData = {
  'PROC-BM-ISOLATION-V1': [
    { step_number: 1, step_name: 'Приём образца', step_type: 'observation', description: 'Проверка маркировки образца, целостности контейнера, температуры доставки', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null },
    { step_number: 2, step_name: 'Разведение костного мозга', step_type: 'passage', description: 'Развести костный мозг PBS или физраствором в соотношении 1:1', is_critical: false, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Нанесение на градиент', step_type: 'passage', description: 'Нанести разведенную суспензию на градиент Ficoll-Paque (плотность 1.077 г/мл)', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null },
    { step_number: 4, step_name: 'Центрифугирование', step_type: 'passage', description: 'Центрифугирование при 400g, 30 минут, комнатная температура, без торможения', is_critical: true, expected_duration_minutes: 30, requires_equipment_scan: true, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 5, step_name: 'Сбор мононуклеаров', step_type: 'passage', description: 'Собрать интерфазу (слой мононуклеарных клеток) пастеровской пипеткой', is_critical: false, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 6, step_name: 'Отмывка клеток', step_type: 'passage', description: 'Трижды отмыть клетки PBS, центрифугируя при 300g по 10 минут', is_critical: false, expected_duration_minutes: 40, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 7, step_name: 'Подсчёт клеток', step_type: 'cell_counting', description: 'Подсчитать концентрацию и жизнеспособность клеток трипановым синим', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: {"min_viability": 80, "expected_viability": 90, "min_concentration": 0.5, "expected_concentration": 2.0} },
    { step_number: 8, step_name: 'Первичный посев', step_type: 'passage', description: 'Посеять клетки в культуральные флаконы с плотностью 10000-20000 кл/см²', is_critical: false, expected_duration_minutes: 20, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 9, step_name: 'Инкубация', step_type: 'observation', description: 'Поместить флаконы в СО2-инкубатор (37°C, 5% CO2)', is_critical: false, expected_duration_minutes: 1440, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null }
  ],
  'PROC-ADIPOSE-ISOLATION-V1': [
    { step_number: 1, step_name: 'Приём и осмотр образца', step_type: 'observation', description: 'Проверка качества ткани, отсутствия загрязнений', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null },
    { step_number: 2, step_name: 'Отмывка ткани', step_type: 'passage', description: 'Многократная отмывка PBS с антибиотиками для удаления крови', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Измельчение ткани', step_type: 'passage', description: 'Механическое измельчение стерильными ножницами до 2-3 мм фрагментов', is_critical: false, expected_duration_minutes: 20, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 4, step_name: 'Ферментативная обработка', step_type: 'passage', description: 'Добавить коллагеназу I типа (1-2 мг/мл), инкубация 60-90 мин при 37°C с встряхиванием', is_critical: true, expected_duration_minutes: 90, requires_equipment_scan: true, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 5, step_name: 'Нейтрализация фермента', step_type: 'passage', description: 'Добавить среду с сывороткой для инактивации коллагеназы', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 6, step_name: 'Центрифугирование', step_type: 'passage', description: 'Центрифугировать при 300g, 10 минут', is_critical: false, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 7, step_name: 'Лизис эритроцитов', step_type: 'passage', description: 'Обработка буфером для лизиса эритроцитов 5-10 минут', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 8, step_name: 'Фильтрация', step_type: 'passage', description: 'Фильтрация через фильтр 100 мкм и 40 мкм', is_critical: false, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 9, step_name: 'Подсчёт клеток SVF', step_type: 'cell_counting', description: 'Подсчёт концентрации и жизнеспособности клеток', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: {"min_viability": 75, "expected_viability": 85, "min_concentration": 1.0, "expected_concentration": 5.0} },
    { step_number: 10, step_name: 'Посев в культуру', step_type: 'passage', description: 'Посев с плотностью 5000-10000 кл/см²', is_critical: false, expected_duration_minutes: 20, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 11, step_name: 'Инкубация', step_type: 'observation', description: 'Помещение в СО2-инкубатор', is_critical: false, expected_duration_minutes: 1440, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null }
  ],
  'PROC-PASSAGE-V2': [
    { step_number: 1, step_name: 'Визуальный контроль', step_type: 'observation', description: 'Осмотр культуры: конфлюэнтность, отсутствие контаминации', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 2, step_name: 'Удаление среды', step_type: 'passage', description: 'Аспирация отработанной среды', is_critical: false, expected_duration_minutes: 2, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Отмывка PBS', step_type: 'passage', description: 'Промывка клеточного слоя PBS', is_critical: false, expected_duration_minutes: 3, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 4, step_name: 'Трипсинизация', step_type: 'passage', description: 'Добавить трипсин-EDTA 0.05-0.25%, инкубация 3-5 мин при 37°C', is_critical: false, expected_duration_minutes: 8, requires_equipment_scan: true, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 5, step_name: 'Нейтрализация трипсина', step_type: 'passage', description: 'Добавить среду с FBS для инактивации', is_critical: false, expected_duration_minutes: 2, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 6, step_name: 'Центрифугирование', step_type: 'passage', description: 'Центрифугировать при 300g, 5 минут', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 7, step_name: 'Ресуспендирование', step_type: 'passage', description: 'Ресуспендировать в свежей среде', is_critical: false, expected_duration_minutes: 3, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 8, step_name: 'Подсчёт клеток', step_type: 'cell_counting', description: 'Подсчёт концентрации и жизнеспособности', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: {"min_viability": 85, "expected_viability": 95, "min_concentration": 0.3, "expected_concentration": 1.0} },
    { step_number: 9, step_name: 'Пересев в новые контейнеры', step_type: 'passage', description: 'Распределение клеток с заданной плотностью посева', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 10, step_name: 'Инкубация', step_type: 'observation', description: 'Помещение в СО2-инкубатор для прикрепления и роста', is_critical: false, expected_duration_minutes: 1440, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null }
  ],
  'PROC-BANKING-V2': [
    { step_number: 1, step_name: 'Проверка культуры', step_type: 'observation', description: 'Визуальный контроль: конфлюэнтность 70-90%, отсутствие контаминации', is_critical: true, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 2, step_name: 'Снятие клеток', step_type: 'passage', description: 'Трипсинизация и сбор клеток', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Центрифугирование', step_type: 'passage', description: 'Центрифугировать при 300g, 5 минут', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 4, step_name: 'Подсчёт клеток', step_type: 'cell_counting', description: 'Определить концентрацию и жизнеспособность', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: {"min_viability": 90, "expected_viability": 95, "min_concentration": 0.5, "expected_concentration": 2.0} },
    { step_number: 5, step_name: 'Подготовка криосреды', step_type: 'banking', description: 'Приготовить среду для заморозки (FBS + DMSO 10% или аналог)', is_critical: false, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null },
    { step_number: 6, step_name: 'Заполнение криовиал', step_type: 'banking', description: 'Расфасовать клеточную суспензию по криовиалам (1-2×10⁶ кл/виала)', is_critical: true, expected_duration_minutes: 20, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 7, step_name: 'Программируемая заморозка', step_type: 'banking', description: 'Контролируемое замораживание -1°C/мин до -80°C', is_critical: true, expected_duration_minutes: 90, requires_equipment_scan: true, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 8, step_name: 'Перенос в криохранилище', step_type: 'banking', description: 'Перенос виал в жидкий азот -196°C для долгосрочного хранения', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null }
  ],
  'PROC-THAWING-V2': [
    { step_number: 1, step_name: 'Извлечение виалы', step_type: 'observation', description: 'Извлечь криовиалу из жидкого азота', is_critical: true, expected_duration_minutes: 2, requires_equipment_scan: false, requires_sop_confirmation: true, cca_rules: null },
    { step_number: 2, step_name: 'Быстрое размораживание', step_type: 'passage', description: 'Разморозить виалу в водяной бане 37°C (90-120 сек)', is_critical: true, expected_duration_minutes: 3, requires_equipment_scan: true, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Перенос клеток', step_type: 'passage', description: 'Немедленно перенести клетки в предварительно подогретую среду', is_critical: false, expected_duration_minutes: 2, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 4, step_name: 'Центрифугирование', step_type: 'passage', description: 'Центрифугировать при 300g, 5 минут для удаления DMSO', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 5, step_name: 'Ресуспендирование', step_type: 'passage', description: 'Ресуспендировать в свежей среде для культивирования', is_critical: false, expected_duration_minutes: 3, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 6, step_name: 'Подсчёт клеток', step_type: 'cell_counting', description: 'Определить концентрацию и жизнеспособность после размораживания', is_critical: true, expected_duration_minutes: 10, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: {"min_viability": 70, "expected_viability": 85, "min_concentration": 0.3, "expected_concentration": 1.5} },
    { step_number: 7, step_name: 'Посев в культуру', step_type: 'passage', description: 'Посеять в культуральные флаконы с повышенной плотностью', is_critical: false, expected_duration_minutes: 15, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 8, step_name: 'Инкубация и наблюдение', step_type: 'observation', description: 'Поместить в СО2-инкубатор, смена среды через 24 часа', is_critical: false, expected_duration_minutes: 1440, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null }
  ],
  'PROC-MEDIA-CHANGE-V1': [
    { step_number: 1, step_name: 'Визуальный контроль', step_type: 'observation', description: 'Проверить состояние культуры и среды под микроскопом', is_critical: false, expected_duration_minutes: 3, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 2, step_name: 'Удаление старой среды', step_type: 'observation', description: 'Аспирировать отработанную среду, оставив минимальный слой над клетками', is_critical: false, expected_duration_minutes: 2, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 3, step_name: 'Добавление свежей среды', step_type: 'observation', description: 'Добавить предварительно подогретую свежую среду (37°C)', is_critical: false, expected_duration_minutes: 5, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null },
    { step_number: 4, step_name: 'Возврат в инкубатор', step_type: 'observation', description: 'Вернуть культуру в СО2-инкубатор', is_critical: false, expected_duration_minutes: 1, requires_equipment_scan: false, requires_sop_confirmation: false, cca_rules: null }
  ]
};

// Step 3: Insert steps for each template
console.log('➕ Inserting steps...\n');
let totalSteps = 0;
let failedTemplates = [];

for (const [templateCode, steps] of Object.entries(allStepsData)) {
  const templateId = templateMap[templateCode];

  if (!templateId) {
    console.log(`   ⚠️  Template ${templateCode} not found, skipping...`);
    continue;
  }

  const stepsToInsert = steps.map(step => ({
    ...step,
    process_template_id: templateId
  }));

  try {
    const result = await supabaseRest('process_template_steps', 'POST', stepsToInsert);
    totalSteps += stepsToInsert.length;
    console.log(`   ✅ ${templateCode}: ${stepsToInsert.length} steps`);
  } catch (error) {
    console.log(`   ❌ ${templateCode}: ${error.message}`);
    failedTemplates.push(templateCode);
  }
}

console.log(`\n✨ Total: ${totalSteps} steps added`);

if (failedTemplates.length > 0) {
  console.log(`\n⚠️  Failed templates: ${failedTemplates.join(', ')}`);
} else {
  console.log('\n🎉 All steps added successfully!');
}
