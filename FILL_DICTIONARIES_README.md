# 📚 Заполнение справочников данными

## Способ 1: Через SQL Editor в Supabase (РЕКОМЕНДУЕТСЯ)

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/mjgogarzewxjxohvormk
2. Перейдите в **SQL Editor**
3. Скопируйте весь SQL из файла `supabase/migrations/1768800000_fill_dictionaries_for_testing.sql`
4. Вставьте в SQL Editor
5. Нажмите **Run** или **Ctrl+Enter**
6. Дождитесь выполнения (может занять 30-60 секунд)

### Ожидаемый результат:

После выполнения вы увидите сообщения типа:
```
NOTICE: ==============================================
NOTICE: DICTIONARY DATA SEEDING COMPLETED
NOTICE: ==============================================
NOTICE: Container Types: 13 records
NOTICE: Vial Types: 5 records
NOTICE: Locations: 10 records
... и т.д.
```

## Способ 2: Через командную строку (альтернатива)

Если есть Supabase CLI:

```bash
supabase db push --file supabase/migrations/1768800000_fill_dictionaries_for_testing.sql
```

## Способ 3: Ручное применение через Node.js (требует отладки)

```bash
node apply-dictionary-migration.mjs
```

Этот способ может потребовать дополнительной настройки переменных окружения.

---

## Проверка результата

После применения миграции проверьте наличие данных:

### В Supabase Dashboard:

1. Откройте **Table Editor**
2. Проверьте следующие таблицы:
   - `container_types` - должно быть 13 записей
   - `vial_types` - 5 записей
   - `locations` - 10 записей
   - `equipment` - 8 записей
   - `storage_zones` - 5 записей
   - `media_recipes` - 7 записей
   - `media_recipe_components` - ~12 записей
   - `inventory_items` - 15 записей
   - `sops` - 10 записей

### Через SQL Query:

```sql
SELECT
  'container_types' as table_name,
  COUNT(*) as count
FROM container_types
UNION ALL
SELECT 'vial_types', COUNT(*) FROM vial_types
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL
SELECT 'storage_zones', COUNT(*) FROM storage_zones
UNION ALL
SELECT 'media_recipes', COUNT(*) FROM media_recipes
UNION ALL
SELECT 'media_recipe_components', COUNT(*) FROM media_recipe_components
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL
SELECT 'sops', COUNT(*) FROM sops;
```

Ожидаемый вывод:
| table_name               | count |
|-------------------------|-------|
| container_types         | 13    |
| vial_types             | 5     |
| locations              | 10    |
| equipment              | 8     |
| storage_zones          | 5     |
| media_recipes          | 7     |
| media_recipe_components| 12    |
| inventory_items        | 15    |
| sops                   | 10    |

---

## Что делать если миграция не применилась

### Ошибка: "relation does not exist"
Это значит, что базовые таблицы еще не созданы. Сначала примените предыдущие миграции:
1. `1767863954_001_base_enums_and_users.sql`
2. `1767863977_002_locations_equipment_sops.sql`
3. `1767864046_004_orders_inventory_media.sql`
4. `1768600000_complete_rls_fix_and_vial_types.sql`

### Ошибка: "duplicate key value"
Это значит, что данные уже существуют. Это нормально - миграция использует `ON CONFLICT DO NOTHING` чтобы избежать дубликатов.

### Ошибка: "permission denied"
Убедитесь, что вы используете пользователя с правами admin или используете service_role_key.

---

## После успешного применения

1. Запустите приложение: `npm run dev`
2. Войдите в систему
3. Проверьте, что справочники заполнены:
   - При создании контейнера должны быть доступны типы T25, T75, T175 и т.д.
   - При выборе локации должны быть Clean Room A, Incubator 01 и т.д.
   - При приготовлении среды должны быть рецепты MSC-GROWTH, FIBRO-GROWTH и т.д.

4. Откройте **TESTING_GUIDE.md** и следуйте сценариям тестирования

---

**Готово!** После заполнения справочников система полностью готова к тестированию всех процессов с интерактивными подсказками.
