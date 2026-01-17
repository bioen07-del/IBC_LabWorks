-- Удаление старых/нерабочих процессов
-- Оставляем только: "Выделение клеток из костного мозга"

-- Сначала удаляем шаги процессов (из-за foreign key constraint)
DELETE FROM process_template_steps
WHERE process_template_id IN (
  SELECT id FROM process_templates
  WHERE name NOT IN ('Выделение клеток из костного мозга')
);

-- Теперь удаляем сами шаблоны процессов
DELETE FROM process_templates
WHERE name NOT IN ('Выделение клеток из костного мозга');

-- Проверка: должен остаться только 1 процесс
SELECT
  pt.id,
  pt.name,
  pt.template_code,
  pt.is_universal,
  pt.applicable_tissue_types,
  COUNT(pts.id) as steps_count
FROM process_templates pt
LEFT JOIN process_template_steps pts ON pts.process_template_id = pt.id
GROUP BY pt.id, pt.name, pt.template_code, pt.is_universal, pt.applicable_tissue_types;
