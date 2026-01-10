**ТЕХНИЧЕСКОЕ ЗАДАНИЕ: Платформа управления производством биомедицинских клеточных продуктов (BMCP Platform)**

**ИСТОРИЯ ИЗМЕНЕНИЙ**

| Версия | Дата | Автор | Описание изменений |
| --- | --- | --- | --- |
| 1.0 | 15.03.2024 | Команда разработки | Первая версия |
| 1.1 | 20.03.2024 | Команда разработки | Добавлены критические доработки: штрих-коды оборудования, карантин сред при контаминации, изменена логика QP approval донаций, добавлен флаг риска at_risk |

**1. ВВЕДЕНИЕ**

**1.1 Назначение документа**

Настоящее техническое задание определяет требования к разработке платформы управления производством биомедицинских клеточных продуктов (BMCP Platform) — веб-системы для автоматизации полного жизненного цикла клеточных культур в GMP-лаборатории.

**1.2 Область применения**

Система предназначена для:

**GMP-лабораторий** по производству клеточных продуктов

**Биотехнологических компаний**, работающих с культурами клеток человека

**Научно-исследовательских центров** в области регенеративной медицины

**1.3 Цели проекта**

**Основные цели:**

**Прослеживаемость (****Traceability****)**: От донора до выдачи продукта, соответствие GMP/GxP

**Автоматизация процессов**: Снижение ручного ввода данных на 80%

**Контроль качества**: Автоматические проверки критериев (CCA)

**Управление отклонениями**: Structured deviation workflow с уведомлениями QP через Telegram

**Управление запасами**: FEFO для материалов и сред

**Масштабируемость**: Поддержка роста от 10 до 1000+ культур одновременно

**Ключевые метрики успеха:**

Время регистрации новой культуры: < 2 минут

Время выполнения типового процесса (пассаж): < 5 минут

Доступность системы: 99.5% (SLA)

Время отклика UI: < 1 секунды для базовых операций

**1.4 Определения и сокращения**

| Термин | Описание |
| --- | --- |
| Culture (Культура) | Клеточная линия, полученная от донора, проходящая этапы роста, пассирования, банкирования |
| Passage (Пассаж) | Процесс переноса клеток в новый контейнер с разведением для продолжения роста |
| Container (Контейнер) | Физический сосуд (флакон, флакс) с клетками, имеет уникальный штрих-код |
| MCB | Master Cell Bank — главный банк клеток (базовая заморозка культуры) |
| WCB | Working Cell Bank — рабочий банк клеток (размороженный MCB для производства) |
| CCA | Critical Criteria Assessment — проверка критических параметров (жизнеспособность, концентрация) |
| FEFO | First Expired First Out — принцип использования материалов по сроку годности |
| QP | Qualified Person — уполномоченное лицо, принимающее решения по качеству |
| QC | Quality Control — контроль качества |
| Deviation | Отклонение от нормы (превышение CCA, контаминация, нарушение процесса) |
| SOP | Standard Operating Procedure — стандартная операционная процедура |
| GMP | Good Manufacturing Practice — надлежащая производственная практика |

**2. КОНЦЕПТУАЛЬНАЯ МОДЕЛЬ**

**2.1 Основные сущности системы**

**2.1.1 Культура (****Culture****)**

**Описание**: Центральная сущность системы — клеточная линия, проходящая полный жизненный цикл от получения от донора до выдачи продукта заказчику.

**Атрибуты:**

culture_code (строка, уникальный, автогенерация): BMCP-C-YYYY-NNN

donation_id (FK): Связь с донацией

cell_type (строка): Тип клеток (например, "MSC", "Fibroblasts")

tissue_source (строка): Источник ткани (например, "Bone marrow", "Adipose tissue")

current_passage (целое число): Текущий номер пассажа (P0, P1, P2...)

status (enum): active, frozen, hold, contaminated, disposed

risk_flag (enum): none, at_risk, critical

risk_flag_reason (текст): Причина установки флага риска

risk_flag_set_at (дата-время): Когда установлен флаг

risk_flag_cleared_at (дата-время): Когда снят флаг

media_batch_used_id (FK): ID партии среды, используемой в текущем пассаже

order_id (FK, опционально): Связь с заказом (если культура для конкретного заказа)

created_at, updated_at: Временные метки

**Связи:**

→ Donation (N:1): Каждая культура получена от одной донации

→ Container (1:N): Одна культура может быть распределена по нескольким контейнерам

→ ExecutedProcess (1:N): История выполненных процессов

→ Deviation (1:N): Отклонения, связанные с культурой

→ QCTest (1:N): Тесты качества

**2.1.2 Контейнер (****Container****)**

**Описание**: Физический сосуд с клетками (флакон T75, биореактор, криовиала).

**Атрибуты:**

container_code (строка, уникальный): T75-042-P4-1

culture_id (FK): Связь с культурой

container_type_id (FK): Тип контейнера (T75, T175, криовиала)

passage_number (целое): Пассаж контейнера

split_index (целое): Индекс при разделении (1, 2, 3...)

status (enum): active, frozen, thawed, disposed, blocked

location_id (FK): Текущая локация (инкубатор, морозильник)

qr_code_data (JSON): Данные для печати QR-кода

volume_ml (decimal, опционально): Объём среды

cell_concentration (decimal, опционально): Концентрация клеток

viability_percent (decimal, опционально): Жизнеспособность

created_at, frozen_at, thawed_at, disposed_at: Временные метки

**Связи:**

→ Culture (N:1): Принадлежит одной культуре

→ ContainerType (N:1): Тип контейнера

→ Location (N:1): Текущее местоположение

→ ExecutedStep (1:N): Шаги процессов, выполненные с контейнером

**2.1.3 Донор (****Donor****)**

**Описание**: Человек, предоставивший биоматериал.

**Атрибуты:**

donor_code (строка, уникальный): DON-YYYY-NNN

birth_year (целое): Год рождения (без точной даты для анонимности)

sex (enum): male, female, other

blood_type (строка, опционально): A+, B-, O+...

ethnicity (строка, опционально)

medical_history (JSON, шифрованный): Медицинская история

consent_form_url (строка): Ссылка на подписанное согласие

is_active (boolean): Может ли донор предоставлять новые донации

created_at: Дата регистрации

**Связи:**

→ Donation (1:N): Может иметь несколько донаций

**2.1.4 Донация (****Donation****)**

**Описание**: Конкретный акт получения биоматериала от донора.

**Атрибуты:**

donation_code (строка, уникальный): DONAT-YYYY-NNN

donor_id (FK): Связь с донором

donation_date (дата): Дата получения материала

tissue_type (строка): Тип ткани (костный мозг, жировая ткань...)

collection_method (строка): Метод получения (аспирация, биопсия...)

volume_ml (decimal): Объём полученного материала

consent_confirmed (boolean): Подтверждение согласия

serology_hiv (enum): negative, positive, pending

serology_hbv (enum): negative, positive, pending

serology_hcv (enum): negative, positive, pending

serology_syphilis (enum): negative, positive, pending

qp_verified (boolean, default=false): Не блокирующий флаг проверки QP

qp_verified_by_user_id (FK): Кто проверил (QP)

qp_verified_at (дата-время): Когда проверено

qp_verification_notes (текст): Комментарии QP

status (enum): received, processing, approved, rejected

created_at: Дата регистрации

**Связи:**

→ Donor (N:1): Принадлежит одному донору

→ Culture (1:N): Может породить несколько культур

**2.1.5 Заказ (****Order****)**

**Описание**: Запрос заказчика на производство клеточного продукта.

**Атрибуты:**

order_code (строка, уникальный): ORD-YYYY-NNN

client_name (строка): Название заказчика/клиники

client_contact (JSON): Контакты (email, телефон, Telegram ID)

cell_type_required (строка): Требуемый тип клеток

quantity_required (целое): Требуемое количество доз/виал

delivery_date_target (дата): Плановая дата выдачи

status (enum): received, in_production, qc_pending, ready, shipped, cancelled

priority (enum): standard, urgent, critical

special_requirements (текст): Особые требования

created_at, updated_at: Временные метки

**Связи:**

→ Culture (1:N): Культуры, созданные для выполнения заказа

→ Release (1:N): Выдачи продукта

**2.1.6 Выдача (****Release****)**

**Описание**: Передача готового клеточного продукта заказчику.

**Атрибуты:**

release_code (строка, уникальный): REL-YYYY-NNN

order_id (FK): Связь с заказом

culture_id (FK): Какая культура выдана

container_ids (JSON array): Список контейнеров в выдаче

release_date (дата): Дата выдачи

qp_approved_by_user_id (FK): Кто утвердил (QP)

qp_approved_at (дата-время): Когда утверждено

certificate_of_analysis_url (строка): Сертификат анализа

shipping_conditions (JSON): Условия доставки (температура, транспорт)

recipient_signature_url (строка): Подпись получателя

status (enum): pending_qp, approved, shipped, delivered, rejected

created_at: Дата создания

**Связи:**

→ Order (N:1): Принадлежит одному заказу

→ Culture (N:1): Связана с одной культурой

→ User (N:1, qp_approved_by): Кто утвердил

**2.1.7 Шаблон процесса (****ProcessTemplate****)**

**Описание**: Предопределённый процесс (SOP) с последовательностью шагов.

**Атрибуты:**

template_code (строка, уникальный): PROC-PASSAGE-V1

name (строка): "Пассирование культуры MSC"

description (текст): Детальное описание процесса

version (строка): v1.0, v2.0...

is_active (boolean): Активен ли шаблон

applicable_cell_types (JSON array): Для каких типов клеток

estimated_duration_minutes (целое): Ориентировочная длительность

requires_clean_room (boolean): Требуется ли чистое помещение

sop_document_url (строка): Ссылка на полный текст SOP

created_at, updated_at: Временные метки

**Связи:**

→ ProcessTemplateStep (1:N): Шаги процесса

→ ExecutedProcess (1:N): Выполненные процессы по этому шаблону

**2.1.8 Шаг шаблона процесса (****ProcessTemplateStep****)**

**Описание**: Отдельный шаг в процессе (например, "Подсчёт клеток", "Центрифугирование").

**Атрибуты:**

process_template_id (FK): Принадлежность к шаблону

step_number (целое): Порядковый номер (1, 2, 3...)

step_name (строка): "Подсчёт клеток"

step_type (enum): measurement, manipulation, incubation, observation

description (текст): Детальное описание действия

sop_reference (строка): Ссылка на конкретный SOP или его раздел

sop_id (FK, опционально): Связь с таблицей SOP (если есть)

requires_sop_confirmation (boolean): Требуется ли подтверждение прочтения SOP

expected_duration_minutes (целое): Ожидаемая длительность

is_critical (boolean): Критический шаг (требует особого контроля)

requires_equipment_scan (boolean): Требуется ли сканирование оборудования

expected_equipment_id (FK, опционально): Ожидаемое оборудование

required_parameters (JSON): Какие параметры нужно ввести

{

  "cell_count": {"type": "number", "unit": "cells/ml", "required": true},

  "viability": {"type": "number", "unit": "%", "min": 0, "max": 100}

}

cca_rules (JSON, опционально): Правила проверки критических критериев

{

  "viability": {"min": 80, "severity": "critical"},

  "cell_count": {"min": 1000000, "severity": "major"}

}

created_at: Дата создания

**Связи:**

→ ProcessTemplate (N:1): Принадлежит шаблону

→ ExecutedStep (1:N): Выполненные шаги по этому шаблону

**2.1.9 Выполненный процесс (****ExecutedProcess****)**

**Описание**: Конкретное выполнение процесса (экземпляр ProcessTemplate).

**Атрибуты:**

process_code (строка, уникальный): EXEC-YYYY-NNN

process_template_id (FK): Какой шаблон использован

culture_id (FK): Для какой культуры выполнен

container_ids (JSON array): Контейнеры, вовлечённые в процесс

started_by_user_id (FK): Кто начал

started_at (дата-время): Когда начат

completed_at (дата-время, nullable): Когда завершён

status (enum): in_progress, completed, paused, aborted

session_id (FK, опционально): Связь с сеансом (для групповых операций)

created_at: Дата создания

**Связи:**

→ ProcessTemplate (N:1): Шаблон процесса

→ Culture (N:1): Культура

→ ExecutedStep (1:N): Выполненные шаги

→ User (N:1, started_by): Кто выполнял

**2.1.10 Выполненный шаг (****ExecutedStep****)**

**Описание**: Конкретное выполнение одного шага процесса.

**Атрибуты:**

executed_process_id (FK): Принадлежность к выполненному процессу

process_template_step_id (FK): Шаблон шага

container_id (FK): Контейнер, с которым работали

executed_by_user_id (FK): Кто выполнил

started_at (дата-время): Начало

completed_at (дата-время, nullable): Завершение

status (enum): pending, in_progress, completed, failed

recorded_parameters (JSON): Введённые параметры

{

  "cell_count": 5000000,

  "viability": 95.5,

  "volume_ml": 15

}

sop_confirmed_at (дата-время, nullable): Когда оператор подтвердил прочтение SOP

scanned_equipment_id (FK, nullable): Какое оборудование было отсканировано

equipment_scan_timestamp (дата-время, nullable): Когда отсканировано

media_batch_used_id (FK, nullable): ID партии среды, использованной в этом шаге

cca_passed (boolean, nullable): Прошёл ли CCA (null если не применимо)

cca_results (JSON, nullable): Результаты проверки CCA

{

  "viability": {"value": 75, "threshold": 80, "passed": false, "severity": "critical"}

}

notes (текст): Комментарии оператора

created_at: Дата создания

**Связи:**

→ ExecutedProcess (N:1): Принадлежит процессу

→ ProcessTemplateStep (N:1): Шаблон шага

→ Container (N:1): Контейнер

→ User (N:1, executed_by): Кто выполнил

→ Equipment (N:1, scanned_equipment): Отсканированное оборудование

→ CombinedMediaBatch (N:1, media_batch_used): Использованная среда

→ Deviation (1:N): Отклонения, созданные из-за этого шага

**2.1.11 Отклонение (****Deviation****)**

**Описание**: Зафиксированное отклонение от нормы (CCA fail, контаминация, нарушение процесса).

**Атрибуты:**

deviation_code (строка, уникальный): DEV-YYYY-NNN

deviation_type (enum): cca_fail, contamination, process_violation, equipment_failure, other

severity (enum): minor, major, critical

culture_id (FK, опционально): Связанная культура

container_id (FK, опционально): Связанный контейнер

executed_step_id (FK, опционально): Шаг, на котором произошло

description (текст): Описание отклонения

detected_by_user_id (FK): Кто обнаружил

detected_at (дата-время): Когда обнаружено

status (enum): open, under_review, resolved, escalated

qp_review_required (boolean): Требуется ли проверка QP

qp_notified_at (дата-время, nullable): Когда QP уведомлён

qp_reviewed_by_user_id (FK, nullable): Кто из QP проверил

qp_reviewed_at (дата-время, nullable): Когда проверено

qp_review_decision (enum, nullable): continue, quarantine, dispose

qp_review_comments (текст): Комментарии QP

root_cause (текст, nullable): Корневая причина (заполняет QP/QC)

corrective_action (текст, nullable): Корректирующее действие

preventive_action (текст, nullable): Превентивное действие

resolved_at (дата-время, nullable): Когда закрыто

created_at: Дата создания

**Связи:**

→ Culture (N:1, опционально): Связанная культура

→ Container (N:1, опционально): Связанный контейнер

→ ExecutedStep (N:1, опционально): Шаг, на котором произошло

→ User (N:1, detected_by): Кто обнаружил

→ User (N:1, qp_reviewed_by): Кто проверил

**2.1.12 QC Тест (****QCTest****)**

**Описание**: Лабораторный тест качества культуры.

**Атрибуты:**

test_code (строка, уникальный): QC-YYYY-NNN

culture_id (FK): Тестируемая культура

container_id (FK, опционально): Контейнер (если тест специфичен для него)

test_type (enum): sterility, mycoplasma, endotoxin, viability, identity, potency

test_method (строка): Метод тестирования

requested_by_user_id (FK): Кто запросил

requested_at (дата-время): Когда запрошен

performed_by_user_id (FK, nullable): Кто выполнил

performed_at (дата-время, nullable): Когда выполнен

result_status (enum): pending, in_progress, passed, failed, inconclusive

result_value (текст): Результат (если применимо)

result_notes (текст): Заметки

certificate_url (строка, nullable): Сертификат

created_at: Дата создания

**Связи:**

→ Culture (N:1): Тестируемая культура

→ Container (N:1, опционально): Контейнер

→ User (N:1, requested_by): Кто запросил

→ User (N:1, performed_by): Кто выполнил

**2.1.13 Материал (****InventoryItem****)**

**Описание**: Расходные материалы и реагенты (среды, сыворотка, реагенты, расходники).

**Атрибуты:**

item_code (строка, уникальный): MAT-YYYY-NNN

item_name (строка): "DMEM", "FBS", "Pipette 10ml"

item_category (enum): media, serum, reagent, consumable, additive

item_type (строка): Детализация (например, "Base medium", "Growth factor")

supplier (строка): Название поставщика

catalog_number (строка): Каталожный номер

lot_number (строка): Номер партии

batch_code (строка): Внутренний код партии (автогенерация)

quantity (decimal): Количество

quantity_remaining (decimal): Остаток

unit (строка): Единица измерения (ml, g, pcs)

receipt_date (дата): Дата поступления

expiry_date (дата): Срок годности

storage_location_id (FK): Где хранится

storage_conditions (строка): Условия хранения (например, "+2°C до +8°C")

status (enum): active, quarantined, expired, depleted, disposed

qc_status (enum): pending, passed, failed

certificate_of_analysis_url (строка, nullable): Сертификат поставщика

created_at, updated_at: Временные метки

**Связи:**

→ Location (N:1, storage): Место хранения

→ MediaComponentBatch (1:N): Партии компонентов для комбинированных сред

→ InventoryTransaction (1:N): Транзакции расходования

**2.1.14 Рецепт среды (****MediaRecipe****)**

**Описание**: Рецепт приготовления комбинированной среды (например, "DMEM + 10% FBS + P/S").

**Атрибуты:**

recipe_code (строка, уникальный): RCP-DMEM-FBS-001

recipe_name (строка): "DMEM с 10% FBS"

recipe_type (enum): base, combined

description (текст): Детальное описание

is_active (boolean): Активен ли рецепт

preparation_sop_reference (строка): Ссылка на SOP приготовления

shelf_life_days (целое): Срок хранения готовой среды (дни)

storage_conditions (строка): Условия хранения готовой среды

created_at, updated_at: Временные метки

**Связи:**

→ MediaRecipeComponent (1:N): Компоненты рецепта

→ CombinedMediaBatch (1:N): Партии, приготовленные по этому рецепту

**2.1.15 Компонент рецепта (****MediaRecipeComponent****)**

**Описание**: Один компонент в рецепте (например, "DMEM 90%", "FBS 10%").

**Атрибуты:**

media_recipe_id (FK): Принадлежность к рецепту

component_name (строка): "DMEM", "FBS", "Penicillin/Streptomycin"

component_type (enum): base_medium, serum, antibiotic, growth_factor, supplement

quantity_percent (decimal, nullable): Процент в рецепте (если применимо)

quantity_per_liter (decimal, nullable): Количество на 1 литр (если фиксированное)

unit (строка): Единица измерения (ml, g, μg)

is_optional (boolean): Опциональный компонент

notes (текст): Примечания

created_at: Дата создания

**Связи:**

→ MediaRecipe (N:1): Принадлежит рецепту

**2.1.16 Партия компонента среды (****MediaComponentBatch****)**

**Описание**: Конкретная партия компонента (связь с InventoryItem).

**Атрибуты:**

inventory_item_id (FK): Связь с инвентарём

component_name (строка): Дубликат для удобства (из InventoryItem)

batch_code (строка): Код партии

lot_number (строка): LOT поставщика

quantity_remaining (decimal): Остаток

unit (строка): Единица

expiry_date (дата): Срок годности

status (enum): active, quarantined, expired, depleted

created_at: Дата регистрации

**Связи:**

→ InventoryItem (N:1): Связь с инвентарём

→ CombinedMediaBatchComponent (1:N): Использование в готовых средах

**2.1.17 Партия комбинированной среды (****CombinedMediaBatch****)**

**Описание**: Готовая партия среды, приготовленная по рецепту.

**Атрибуты:**

batch_code (строка, уникальный): MED-YYYY-NNN

media_recipe_id (FK): Рецепт

preparation_date (дата): Дата приготовления

expiry_date (дата): Срок годности (расчётный)

volume_ml (decimal): Общий объём

volume_remaining_ml (decimal): Остаток

sterility_status (enum): pending, passed, failed

status (enum): active, quarantined, expired, depleted, disposed

prepared_by_user_id (FK): Кто приготовил

storage_location_id (FK): Где хранится

qr_code_data (JSON): Данные для QR-кода

notes (текст): Примечания

created_at: Дата создания

**Связи:**

→ MediaRecipe (N:1): Рецепт

→ CombinedMediaBatchComponent (1:N): Компоненты, использованные в этой партии

→ User (N:1, prepared_by): Кто приготовил

→ Location (N:1, storage): Место хранения

→ ExecutedStep (1:N): Использование в процессах

**2.1.18 Компоненты партии комбинированной среды (****CombinedMediaBatchComponent****)**

**Описание**: Связь партии готовой среды с использованными компонентами (для прослеживаемости).

**Атрибуты:**

combined_media_batch_id (FK): Готовая среда

media_component_batch_id (FK): Использованный компонент

quantity_used (decimal): Количество использованного компонента

unit (строка): Единица

created_at: Дата создания

**Связи:**

→ CombinedMediaBatch (N:1): Готовая среда

→ MediaComponentBatch (N:1): Компонент

**2.1.19 Транзакция инвентаря (****InventoryTransaction****)**

**Описание**: Запись расходования материала.

**Атрибуты:**

inventory_item_id (FK): Какой материал

transaction_type (enum): receipt, usage, disposal, adjustment, quarantine

quantity (decimal): Количество (положительное для прихода, отрицательное для расхода)

unit (строка): Единица

executed_step_id (FK, nullable): Связь с шагом процесса (если расходование)

combined_media_batch_id (FK, nullable): Связь с приготовлением среды

performed_by_user_id (FK): Кто выполнил

reason (текст): Причина

timestamp (дата-время): Когда

created_at: Дата создания

**Связи:**

→ InventoryItem (N:1): Материал

→ ExecutedStep (N:1, опционально): Шаг процесса

→ CombinedMediaBatch (N:1, опционально): Приготовление среды

→ User (N:1, performed_by): Кто выполнил

**2.1.20 Оборудование (Equipment)**

**Описание**: Лабораторное оборудование (инкубаторы, ламинары, центрифуги, микроскопы).

**Атрибуты:**

equipment_code (строка, уникальный): INC-01, LAM-02, CENT-03

equipment_name (строка): "Инкубатор CO2 Thermo Scientific"

equipment_type (enum): incubator, laminar_hood, centrifuge, microscope, freezer, other

serial_number (строка): Серийный номер

manufacturer (строка): Производитель

model (строка): Модель

location_id (FK): Текущее расположение

status (enum): operational, maintenance, calibration_due, retired

last_calibration_date (дата): Последняя калибровка

calibration_valid_until (дата): Калибровка действительна до

calibration_frequency_days (целое): Периодичность калибровки (дни)

qr_code_data (JSON): Данные для печати QR-кода

{

  "equipment_id": "INC-01",

  "equipment_code": "INC-01",

  "calibration_valid_until": "2024-06-15"

}

maintenance_notes (текст): Заметки по обслуживанию

created_at, updated_at: Временные метки

**Связи:**

→ Location (N:1): Где находится

→ ExecutedStep (1:N): Использование в процессах

**2.1.21 Локация (****Location****)**

**Описание**: Физическое место хранения/работы (комната, инкубатор, морозильник, полка).

**Атрибуты:**

location_code (строка, уникальный): ROOM-A, INC-01-SHELF-2, FREEZER-LN2-RACK-5

location_name (строка): "Комната A, Инкубатор 1, Полка 2"

location_type (enum): room, incubator, freezer, refrigerator, shelf, rack

parent_location_id (FK, nullable): Вложенность (например, полка в инкубаторе)

temperature_min (decimal, nullable): Минимальная температура (°C)

temperature_max (decimal, nullable): Максимальная температура (°C)

capacity (целое, nullable): Вместимость (количество контейнеров)

current_occupancy (целое): Текущая занятость

is_clean_room (boolean): Чистое помещение (GMP)

status (enum): active, maintenance, restricted

created_at, updated_at: Временные метки

**Связи:**

→ Location (N:1, parent): Родительская локация

→ Container (1:N): Контейнеры в локации

→ Equipment (1:N): Оборудование в локации

→ InventoryItem (1:N): Материалы в локации

**2.1.22 Тип контейнера (****ContainerType****)**

**Описание**: Справочник типов контейнеров (T25, T75, T175, криовиала, биореакторы).

**Атрибуты:**

type_code (строка, уникальный): T75, T175, CRYOVIAL-2ML, BIOREACTOR-1L

type_name (строка): "T75 Flask"

category (enum): flask, plate, cryovial, bag, bioreactor

volume_ml (decimal): Объём

surface_area_cm2 (decimal, nullable): Площадь поверхности роста

manufacturer (строка): Производитель

catalog_number (строка): Каталожный номер

is_active (boolean): Используется ли

created_at: Дата создания

**Связи:**

→ Container (1:N): Контейнеры этого типа

**2.1.23 Сеанс (****Session****)**

**Описание**: Сеанс работы в ламинарном боксе (для групповых операций).

**Атрибуты:**

session_code (строка, уникальный): SES-YYYY-NNN

session_type (enum): passage, thawing, freezing, qc_sampling, other

started_by_user_id (FK): Кто начал

started_at (дата-время): Начало

completed_at (дата-время, nullable): Завершение

location_id (FK): Где проходил (ламинарный бокс)

status (enum): in_progress, completed, aborted

cultures_processed (JSON array): Список culture_id

notes (текст): Заметки

created_at: Дата создания

**Связи:**

→ User (N:1, started_by): Кто начал

→ Location (N:1): Место проведения

→ ExecutedProcess (1:N): Процессы в сеансе

**2.1.24 Пользователь (User)**

**Описание**: Сотрудник лаборатории.

**Атрибуты:**

username (строка, уникальный): ivan.petrov

email (строка, уникальный): ivan.petrov@bmcp.lab

full_name (строка): "Иван Петров"

role (enum): operator, qc, qp, admin, viewer

is_active (boolean): Активен ли аккаунт

password_hash (строка): Хеш пароля (bcrypt)

last_login_at (дата-время): Последний вход

created_at: Дата регистрации

**Связи:**

→ TelegramUser (1:1, опционально): Связь с Telegram

→ ExecutedProcess (1:N): Выполненные процессы

→ ExecutedStep (1:N): Выполненные шаги

→ Deviation (1:N): Обнаруженные отклонения

→ QCTest (1:N): Выполненные тесты

**2.1.25 Пользователь ****Telegram**** (****TelegramUser****)**

**Описание**: Связь пользователя с Telegram для уведомлений.

**Атрибуты:**

user_id (FK, уникальный): Связь с User

telegram_id (bigint, уникальный): Telegram ID

telegram_username (строка, nullable): @username

verified (boolean): Подтверждена ли связь

verification_code (строка, nullable): Код подтверждения

verification_sent_at (дата-время, nullable): Когда отправлен код

notifications_enabled (boolean): Включены ли уведомления

notification_preferences (JSON): Настройки уведомлений

{

  "deviations": true,

  "new_cultures": false,

  "qc_results": true

}

created_at, updated_at: Временные метки

**Связи:**

→ User (1:1): Связь с пользователем

**2.1.26 ****Audit**** ****Log**

**Описание**: Журнал всех действий в системе (GMP requirement).

**Атрибуты:**

id (bigint, PK): Первичный ключ

timestamp (дата-время): Когда произошло

user_id (FK, nullable): Кто выполнил (null для системных действий)

action_type (enum): create, update, delete, approve, reject, print, export

entity_type (строка): Тип сущности (Culture, Container, Deviation...)

entity_id (bigint): ID сущности

changes (JSON): Что изменилось (было → стало)

{

  "status": {"old": "active", "new": "frozen"},

  "location_id": {"old": 5, "new": 10}

}

ip_address (строка): IP адрес

user_agent (строка): Браузер/устройство

comment (текст, nullable): Комментарий к действию

**Индексы:**

По timestamp (для быстрых запросов истории)

По entity_type + entity_id (для истории конкретной сущности)

По user_id (для истории действий пользователя)

**2.2 Статусы культуры и контейнера**

**2.2.1 Статусы культуры (****Culture.status****)**

| Статус | Описание | Переходы |
| --- | --- | --- |
| active | Культура активна, растёт в инкубаторе | → frozen (заморозка), → hold (карантин), → contaminated (обнаружена контаминация), → disposed (утилизация) |
| frozen | Культура заморожена (MCB/WCB) | → active (разморозка), → disposed (утилизация из банка) |
| hold | Карантин (Deviation, ожидание решения QP) | → active (QP решение "продолжить"), → disposed (QP решение "утилизировать") |
| contaminated | Подтверждена контаминация | → disposed (обязательная утилизация) |
| disposed | Утилизирована | Конечный статус |

**2.2.2 Флаги риска культуры (****Culture.risk_flag****)**

**Описание**: Независимое поле от status, показывающее уровень риска культуры.

| Флаг | Описание | Когда устанавливается |
| --- | --- | --- |
| none | Нет рисков | По умолчанию |
| at_risk | Обнаружено отклонение (Deviation), но QP ещё не принял решение | Автоматически при создании Deviation с CCA fail или minor нарушении |
| critical | Множественные отклонения или критическая контаминация | При множественных Deviation или severity=critical |

**Логика работы с флагами:**

CCA fail → risk_flag = 'at_risk' + создание Deviation

QP решение "Продолжить" → risk_flag = 'none' (снят), risk_flag_cleared_at = NOW()

QP решение "Карантин" → risk_flag сохраняется, status = 'hold'

QP решение "Утилизировать" → status = 'disposed', risk_flag не меняется (для истории)

**Важно**: Культура может быть status = 'active' И risk_flag = 'at_risk' одновременно (работа продолжается под наблюдением, пока QP не примет решение).

**2.2.3 Статусы контейнера (****Container.status****)**

| Статус | Описание | Переходы |
| --- | --- | --- |
| active | Контейнер с активной культурой | → frozen, → thawed, → disposed, → blocked |
| frozen | Контейнер заморожен | → thawed (разморозка), → disposed |
| thawed | Контейнер разморожен | → active (начало культивирования), → disposed |
| disposed | Контейнер утилизирован | Конечный статус |
| blocked | Контейнер заблокирован (Deviation, карантин) | → active (QP решение), → disposed |

**2.3 Этапы жизненного цикла культуры**

**2.3.1 Базовый жизненный цикл**

ДОНОР → ДОНАЦИЯ → ПЕРВИЧНАЯ КУЛЬТУРА (P0) → ПАССИРОВАНИЕ (P1, P2, P3...) →

→ БАНКИРОВАНИЕ (MCB) → РАЗМОРАЖИВАНИЕ WCB → ПРОИЗВОДСТВО → ВЫДАЧА

**2.3.2 Альтернативные пути**

**Из MCB в утилизацию**: Если контроль качества не пройден

**Из активной культуры в ****hold**: При обнаружении Deviation

**Из ****hold**** в утилизацию**: По решению QP

**3. ДЕТАЛЬНОЕ ОПИСАНИЕ БИЗНЕС-ПРОЦЕССОВ**

**3.1 Процесс: Регистрация донора и получение донации**

**3.1.1 Участники**

**Operator**: Регистрирует донора и донацию

**QP**: Асинхронно проверяет документы (не блокирует процесс)

**3.1.2 Предусловия**

Получено письменное согласие донора

Проведена серология (или запланирована)

**3.1.3 Шаги процесса**

**Шаг 1: Регистрация донора (если новый)**

**Оператор:**

Переходит в раздел "Доноры" → "Добавить донора"

Заполняет форму: 

Год рождения (без точной даты)

Пол

Группа крови (опционально)

Этничность (опционально)

Медицинская история (зашифрованная)

Загружает скан подписанного согласия (PDF)

Нажимает "Сохранить"

**Система:**

Генерирует donor_code (DON-YYYY-NNN)

Создаёт запись Donor

is_active = true

Сохраняет файл согласия в зашифрованное хранилище

Возвращает подтверждение

**Шаг 2: Регистрация донации**

**Оператор:**

Переходит в карточку донора → "Создать донацию"

Заполняет форму: 

Дата получения материала

Тип ткани (picklist: костный мозг, жировая ткань, кожа...)

Метод получения (аспирация, биопсия...)

Объём полученного материала (ml)

Согласие подтверждено: ☑️

Серология: 

HIV: [pending / negative / positive]

HBV: [pending / negative / positive]

HCV: [pending / negative / positive]

Сифилис: [pending / negative / positive]

Нажимает "Создать донацию"

**Система:**

Генерирует donation_code (DONAT-YYYY-NNN)

Создаёт запись Donation

status = 'received' (сразу доступна для работы)

qp_verified = false (флаг, не блокирует процесс)

Создаёт асинхронную задачу (Celery): 

Через 4 часа → уведомление QP (Telegram + email):
"Новая донация DONAT-2024-042 требует проверки документов"

Возвращает подтверждение

**Шаг 3: Асинхронная проверка QP (параллельно с работой оператора)**

**QP (когда получит уведомление):**

Открывает карточку донации

Проверяет: 

Согласие загружено и подписано

Серология заполнена (или запланирована)

Все данные корректны

**Если всё ОК:** 

Нажимает "Подтвердить проверку"

donation.qp_verified = true

qp_verified_by_user_id = QP ID

qp_verified_at = NOW()

Комментарии (опционально)

**Если есть проблема:** 

Создаёт Deviation: 

deviation_type = 'process_violation'

severity = 'major'

description = "Отсутствует подписанное согласие донора"

Если уже создана культура из этой донации → культура автоматически переходит в status = 'hold'

Уведомление оператору

**3.1.4 Особенности реализации**

**Важно**: QP проверка НЕ блокирует создание культуры из донации. Оператор может сразу начать работу после регистрации донации.

**Автоматическая валидация при создании донации:**

# Псевдокод

if not donation.consent_confirmed:

    show_warning("⚠️ Согласие не подтверждено. Продолжить?")

    # Но не блокировать

if any(serology in ['pending', None] for serology in [hiv, hbv, hcv, syphilis]):

    show_warning("⚠️ Серология не завершена. Продолжить с ограничениями?")

    # Но не блокировать

**Celery**** задача (асинхронное уведомление QP):**

@celery.task

def notify_qp_new_donation(donation_id):

    # Ждём 4 часа

    time.sleep(4 * 3600)

    donation = Donation.get(donation_id)

    if donation.qp_verified:

        return  # Уже проверено

    qp_users = User.filter(role='qp', is_active=True)

    for qp in qp_users:

        send_telegram_notification(qp, f"Новая донация {donation.donation_code} требует проверки")

        send_email(qp.email, "Проверка донации", ...)

**3.1.5 Постусловия**

Донация зарегистрирована и доступна для создания культуры

QP уведомлён (асинхронно) для проверки документов

Audit log записан

**3.2 Процесс: Создание первичной культуры (P0)**

**3.2.1 Участники**

**Operator**: Создаёт культуру и контейнеры

**3.2.2 Предусловия**

Донация зарегистрирована (даже если QP ещё не проверил)

Биоматериал получен и доставлен в лабораторию

**3.2.3 Шаги процесса**

**Шаг 1: Создание культуры**

**Оператор:**

Переходит в раздел "Культуры" → "Создать культуру"

Заполняет форму: 

Донация: [выбор из списка доступных донаций]

Тип клеток: [MSC / Fibroblasts / Keratinocytes / Custom]

Источник ткани: [заполняется автоматом из донации]

Заказ (опционально): [если культура для конкретного заказа]

Пассаж: P0 (автоматически)

Нажимает "Создать культуру"

**Система:**

Генерирует culture_code (BMCP-C-YYYY-NNN)

Создаёт запись Culture: 

donation_id = выбранная донация

current_passage = 0

status = 'active'

risk_flag = 'none'

Возвращает ID культуры

**Шаг 2: Создание контейнеров**

**Оператор:**

В карточке культуры нажимает "Добавить контейнер"

Выбирает: 

Тип контейнера: [T25 / T75 / T175 / Custom]

Количество: [1-10]

Среда: [выбор партии среды из списка FEFO]

Объём среды (ml): [автозаполнение по типу контейнера]

Локация: [Incubator INC-01, Shelf 2]

Нажимает "Создать контейнеры"

**Система:**

Для каждого контейнера: 

Генерирует container_code (T75-042-P0-1, T75-042-P0-2...)

Создаёт запись Container: 

culture_id = ID культуры

passage_number = 0

split_index = 1, 2, 3...

status = 'active'

location_id = выбранная локация

Генерирует QR-код (JSON):

{

  "container_id": 123,

  "container_code": "T75-042-P0-1",

  "culture_code": "BMCP-C-2024-042",

  "passage": 0,

  "created_at": "2024-03-15T10:00:00Z"

}

Отправляет на печать этикеток (принтер этикеток Zebra/DYMO)

Обновляет location.current_occupancy += количество контейнеров

Создаёт InventoryTransaction (расходование среды): 

inventory_item_id = выбранная партия среды

transaction_type = 'usage'

quantity = -(объём среды * количество контейнеров)

Обновляет inventory_item.quantity_remaining

**Шаг 3: Печать этикеток**

**Система автоматически:**

Для каждого контейнера формирует команду печати (ZPL для Zebra):

^XA

^FO50,50^BQN,2,6^FDQA,{qr_code_json}^FS

^FO50,250^FDT75-042-P0-1^FS

^FO50,300^FDBMCP-C-2024-042^FS

^FO50,350^FDP0 | 15.03.24^FS

^XZ

Отправляет на принтер этикеток

Создаёт audit log: "Label printed for container T75-042-P0-1"

**Оператор:**

Наклеивает распечатанные этикетки на флаконы

Помещает флаконы в инкубатор согласно указанной локации

**3.2.4 Постусловия**

Культура создана, статус active

Контейнеры созданы с уникальными QR-кодами

Этикетки распечатаны

Контейнеры размещены в инкубаторе

Среда списана из инвентаря

**3.3 Процесс: ****Пассирование**** культуры (****Passage****)**

**3.3.1 Участники**

**Operator**: Выполняет пассаж

**3.3.2 Предусловия**

Культура в статусе active

Контейнеры достигли нужной конфлюэнтности (обычно 80-90%)

Доступны расходники и среда

**3.3.3 Шаги процесса**

**Шаг 1: Инициация пассажа**

**Оператор:**

Открывает карточку культуры

Нажимает "Пассировать"

Система предлагает шаблон процесса: "Пассирование MSC (SOP-042 v2.1)"

Оператор выбирает: 

Исходные контейнеры: [T75-042-P3-1, T75-042-P3-2] (чекбоксы)

Коэффициент разведения: [1:2 / 1:3 / 1:4 / Custom]

Тип новых контейнеров: [T75 / T175]

Количество новых контейнеров: [автоматический расчёт или ручной ввод]

Среда: [выбор партии по FEFO, система предлагает первую с ближайшим сроком]

Нажимает "Начать процесс"

**Система:**

Создаёт ExecutedProcess: 

process_code = EXEC-YYYY-NNN

process_template_id = шаблон "Пассирование MSC"

culture_id = ID культуры

status = 'in_progress'

started_by_user_id = ID оператора

Создаёт новые контейнеры (пустые, статус pending): 

container_code = T75-042-P4-1, T75-042-P4-2...

passage_number = 4 (текущий + 1)

status = 'pending' (до завершения процесса)

Печатает этикетки для новых контейнеров

Переходит к первому шагу процесса

**Шаг 2: Выполнение шагов процесса (по шаблону SOP)**

Пример шагов в шаблоне "Пассирование MSC":

**2.1. Подготовка (Step 1): Сканирование ламинарного бокса**

**UI отображает:**

Шаг 1/8: Подготовка

Описание: Работайте в ламинарном боксе LAM-02 (согласно SOP-042 v2.1)

[Сканировать QR-код оборудования]

**Оператор:**

Открывает камеру планшета/телефона (кнопка "Сканировать QR-код")

Сканирует QR-код на ламинарном боксе

**Система:**

Парсит JSON из QR-кода:

{

  "equipment_id": "LAM-02",

  "equipment_code": "LAM-02",

  "calibration_valid_until": "2024-06-15"

}

Валидация: 

✅ Оборудование существует

✅ Калибровка не просрочена (calibration_valid_until >= today)

✅ Статус = operational

Если валидация прошла: 

Зелёная галочка ✅

ExecutedStep.scanned_equipment_id = LAM-02 ID

ExecutedStep.equipment_scan_timestamp = NOW()

Переход к следующему полю

Если валидация не прошла: 

Красная ошибка ❌

Сообщение: "Ламинарный бокс LAM-02: истёк срок калибровки (15.02.2024)"

Блокировка шага (нельзя продолжить без escalation)

**2.2. Аспирация среды (Step 2)**

**UI отображает:**

Шаг 2/8: Аспирация старой среды

Описание: Удалите среду из исходных контейнеров

Контейнеры:

□ T75-042-P3-1 [Сканировать]

□ T75-042-P3-2 [Сканировать]

Комментарии (опционально): __________

[Завершить шаг]

**Оператор:**

Сканирует каждый контейнер (или ставит галочки вручную)

Добавляет комментарии (если нужно)

Нажимает "Завершить шаг"

**Система:**

Создаёт ExecutedStep: 

step_number = 2

status = 'completed'

completed_at = NOW()

**2.3. Подсчёт клеток (Step 3): Критический шаг с CCA**

**UI отображает:**

Шаг 3/8: Подсчёт клеток ⚠️ КРИТИЧЕСКИЙ ШАГ

Описание: Подсчитайте концентрацию и жизнеспособность клеток (SOP-042 §3.2)

Применить ко всем контейнерам: ☐

Контейнер T75-042-P3-1:

- Концентрация клеток (cells/ml)*: __________

- Жизнеспособность (%)*: __________

- Объём суспензии (ml)*: __________

Контейнер T75-042-P3-2:

- Концентрация клеток (cells/ml)*: __________

- Жизнеспособность (%)*: __________

- Объём суспензии (ml)*: __________

[Завершить шаг]

**Оператор:**

Выполняет подсчёт клеток (гемоцитометр или автоматический счётчик)

Вводит данные для каждого контейнера: 

T75-042-P3-1: 5000000 cells/ml, 95.5%, 15 ml

T75-042-P3-2: 4800000 cells/ml, 78%, 15 ml

Нажимает "Завершить шаг"

**Система (автоматическая проверка CCA):**

Для каждого контейнера:

Применяет правила из ProcessTemplateStep.cca_rules:

{

  "viability": {"min": 80, "severity": "critical"},

  "cell_count": {"min": 1000000, "severity": "major"}

}

**Контейнер T75-042-P3-1:**

Жизнеспособность: 95.5% ≥ 80% ✅

Концентрация: 5000000 ≥ 1000000 ✅

ExecutedStep.cca_passed = true

ExecutedStep.cca_results:

{

  "viability": {"value": 95.5, "threshold": 80, "passed": true},

  "cell_count": {"value": 5000000, "threshold": 1000000, "passed": true}

}

**Контейнер T75-042-P3-2:**

Жизнеспособность: 78% < 80% ❌

ExecutedStep.cca_passed = false

ExecutedStep.cca_results:

{

  "viability": {"value": 78, "threshold": 80, "passed": false, "severity": "critical"},

  "cell_count": {"value": 4800000, "threshold": 1000000, "passed": true}

}

**Автоматическое создание ****Deviation****:**

Deviation.deviation_code = DEV-2024-088

deviation_type = 'cca_fail'

severity = 'critical' (из CCA rules)

culture_id = BMCP-C-2024-042

container_id = T75-042-P3-2

executed_step_id = ID этого шага

description = "Жизнеспособность клеток (78%) ниже порога (80%)"

qp_review_required = true

status = 'open'

**Обновление культуры:**

Culture.risk_flag = 'at_risk'

Culture.risk_flag_reason = "CCA fail: viability 78% < 80%"

Culture.risk_flag_set_at = NOW()

**Обновление контейнера:**

Container.status = 'blocked' (временно заблокирован)

**Уведомление QP (****Telegram****):**

⚠️ КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ

DEV-2024-088

Тип: Превышение порога CCA

Серьёзность: Критическая

Культура: BMCP-C-2024-042 (MSC, P3)

Контейнер: T75-042-P3-2

Проблема: Жизнеспособность 78% (норма ≥80%)

Требуется решение:

[Продолжить культивирование] [Карантин] [Утилизировать]

**UI оператора:**

Красное предупреждение:

⚠️ ОТКЛОНЕНИЕ: Контейнер T75-042-P3-2 не прошёл проверку CCA

Жизнеспособность 78% (требуется ≥80%)

Создано отклонение DEV-2024-088

QP уведомлён. Ожидайте решения.

Кнопка "Продолжить процесс" активна (можно продолжить с остальными контейнерами)

Контейнер T75-042-P3-2 помечен красным, недоступен для дальнейших действий до решения QP

**2.4. Остальные шаги** (Трипсинизация, Центрифугирование, Ресуспендирование...)

Аналогично: оператор выполняет действия, вводит данные (если требуется), система записывает ExecutedStep.

**2.5. Посев в новые контейнеры (Step 7)**

**UI отображает:**

Шаг 7/8: Посев клеток в новые контейнеры

Среда: MED-2024-050 (DMEM+10%FBS, exp 2024-04-15) ⭐ FEFO

[Сканировать партию среды]

Новые контейнеры:

□ T75-042-P4-1: Объём среды (ml): _____ [Сканировать контейнер]

□ T75-042-P4-2: Объём среды (ml): _____ [Сканировать контейнер]

[Завершить шаг]

**Оператор:**

Сканирует QR-код бутыли среды (или выбирает вручную)

Сканирует каждый новый контейнер (для подтверждения)

Вводит объём среды для каждого

Нажимает "Завершить шаг"

**Система:**

Валидация FEFO: 

Проверяет, есть ли партии среды с более ранним expiry_date

Если да: 

Жёлтое предупреждение:

⚠️ FEFO: Доступна партия MED-2024-048 с более ранним сроком (2024-04-01)

Рекомендуется использовать её.

Кнопки: 

[Использовать рекомендованную партию MED-2024-048]

[Всё равно использовать MED-2024-050] → создаёт Deviation severity='minor'

Создаёт ExecutedStep: 

media_batch_used_id = выбранная партия среды

Создаёт InventoryTransaction: 

transaction_type = 'usage'

quantity = -(объём * количество контейнеров)

Обновляет CombinedMediaBatch.volume_remaining_ml

**2.6. Размещение в инкубаторе (Step 8): Сканирование инкубатора**

**UI отображает:**

Шаг 8/8: Размещение в инкубаторе

Описание: Поместите контейнеры в инкубатор INC-01 (37°C, 5% CO2)

[Сканировать QR-код инкубатора]

Локация: [выбор полки внутри инкубатора]

[Завершить процесс]

**Оператор:**

Сканирует QR-код инкубатора

Выбирает полку: "INC-01, Shelf 2"

Нажимает "Завершить процесс"

**Система:**

Валидация оборудования (аналогично Step 1)

Если OK: 

Обновляет контейнеры: 

Container.status = 'active' (для новых контейнеров)

Container.location_id = INC-01, Shelf 2

Обновляет исходные контейнеры: 

Container.status = 'disposed' (старые контейнеры после пассажа)

Обновляет культуру: 

Culture.current_passage = 4

Обновляет процесс: 

ExecutedProcess.status = 'completed'

ExecutedProcess.completed_at = NOW()

Обновляет локации: 

Location.current_occupancy += количество новых контейнеров

Успешное сообщение:

✅ Пассаж завершён успешно!

Культура BMCP-C-2024-042 теперь в пассаже P4

Создано 2 новых контейнера (T75-042-P4-1, T75-042-P4-2)

**3.3.4 Сценарий: Решение QP по ****Deviation**** (через ****Telegram****)**

**QP получает уведомление в ****Telegram****:**

⚠️ КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ

DEV-2024-088

Тип: Превышение порога CCA

Серьёзность: Критическая

Культура: BMCP-C-2024-042 (MSC, P3)

Контейнер: T75-042-P3-2

Проблема: Жизнеспособность 78% (норма ≥80%)

Требуется решение:

[Продолжить культивирование] [Карантин] [Утилизировать]

**Вариант 1: QP нажимает "Продолжить культивирование"**

**Telegram**** бот:**

Вы выбрали: Продолжить культивирование

Введите комментарий (обязательно):

**QP вводит:**

Жизнеспособность на границе нормы (78%). 

Принято решение продолжить под усиленным наблюдением.

Следующий контроль через 48 часов.

**Система (****backend****):**

Обновляет Deviation:

qp_reviewed_by_user_id = QP ID

qp_reviewed_at = NOW()

qp_review_decision = 'continue'

qp_review_comments = текст от QP

status = 'resolved'

resolved_at = NOW()

Обновляет контейнер:

Container.status = 'active' (разблокирован)

Обновляет культуру:

Culture.risk_flag = 'none' (флаг снят)

Culture.risk_flag_cleared_at = NOW()

Создаёт задачу (Task):

task_type = 'qc_check'

due_date = NOW() + 48 часов

description = "Повторная проверка жизнеспособности культуры BMCP-C-2024-042"

assigned_to_user_id = Operator ID

Уведомление оператору (UI + Telegram):

✅ DEV-2024-088 закрыто

Решение QP: Продолжить культивирование

Комментарий: Жизнеспособность на границе нормы...

Создана задача: Повторная проверка через 48 часов

Telegram подтверждение QP:

✅ Ваше решение сохранено

Deviation DEV-2024-088 закрыто

Контейнер T75-042-P3-2 разблокирован

**Вариант 2: QP нажимает "Карантин"**

**Система:**

Обновляет Deviation:

qp_review_decision = 'quarantine'

status = 'resolved'

Обновляет контейнер:

Container.status = 'blocked' (остаётся заблокирован)

Обновляет культуру:

Culture.status = 'hold' (вся культура на карантине)

Culture.risk_flag = 'at_risk' (флаг остаётся)

**Карантин среды (новая логика):**

Находит ExecutedStep.media_batch_used_id (среда, которая использовалась в последнем feeding/passage)

Если это CombinedMediaBatch: 

CombinedMediaBatch.status = 'quarantined'

Создаёт Investigation Task для QC:

Тип: Расследование

Приоритет: Высокий

Описание: Определить источник контаминации культуры BMCP-C-2024-042:

- Готовая среда MED-2024-050?

- Компоненты (base medium, serum, additives)?

Действия:

1. Проверить стерильность готовой среды

2. Проверить стерильность компонентов (если готовая среда чистая)

3. Проверить логи приготовления среды

Базовые компоненты (MediaComponentBatch) **остаются ****status**** = '****active****'** (пока QC не определит виновный компонент)

Создаёт автозадачу:

task_type = 'move_to_quarantine'

description = "Переместить контейнер T75-042-P3-2 в карантинную зону"

Уведомление оператору:

⚠️ DEV-2024-088: Контейнер на карантине

Решение QP: Карантин

Культура BMCP-C-2024-042 переведена в статус Hold

Среда MED-2024-050 переведена на карантин

Действие: Переместите контейнер T75-042-P3-2 в карантинную зону QUAR-01

**Вариант 3: QP нажимает "Утилизировать"**

**Система:**

Обновляет Deviation:

qp_review_decision = 'dispose'

status = 'resolved'

Обновляет контейнер:

Container.status = 'disposed'

Обновляет культуру:

Если это единственный контейнер → Culture.status = 'disposed'

Если есть другие активные контейнеры → культура остаётся active (но с риском)

Создаёт автозадачу:

task_type = 'dispose_container'

description = "Утилизировать контейнер T75-042-P3-2 согласно SOP-DISPOSAL-001"

Уведомление оператору:

❌ DEV-2024-088: Контейнер подлежит утилизации

Решение QP: Утилизировать

Действие: Утилизируйте контейнер T75-042-P3-2 согласно SOP-DISPOSAL-001

Если культура была для заказа → уведомление заказчику (Telegram, если есть связь):

⚠️ Заказ ORD-2024-015: Задержка производства

Культура BMCP-C-2024-042 (контейнер T75-042-P3-2) утилизирована по решению QP (низкая жизнеспособность)

Производство продолжается с резервными контейнерами.

Ориентировочная дата выдачи: +3 дня

**3.3.5 Постусловия**

Культура пассирована (новый пассаж P4)

Новые контейнеры созданы с QR-кодами

Старые контейнеры утилизированы

Среда списана из инвентаря

Если были отклонения CCA → Deviation создан, QP принял решение

Audit log записан

**3.4 Процесс: ****Банкирование**** (MCB/WCB)**

**3.4.1 Участники**

**Operator**: Выполняет заморозку

**QC**: Проводит тесты перед банкированием

**QP**: Утверждает MCB

**3.4.2 Предусловия**

Культура прошла необходимые тесты QC (стерильность, микоплазма)

Культура в нужном пассаже (обычно P3-P5 для MCB)

**3.4.3 Шаги процесса**

**Шаг 1: Инициация ****банкирования**

**Оператор:**

Открывает карточку культуры

Нажимает "Создать банк клеток"

Выбирает: 

Тип банка: [MCB / WCB]

Исходные контейнеры: [выбор контейнеров для заморозки]

Количество криовиал: [например, 20]

Объём на виалу (ml): [1.0]

Криопротектор: [DMSO 10%]

Локация хранения: [Freezer -80°C, Rack 5, Box 2]

Нажимает "Начать процесс"

**Система:**

Создаёт ExecutedProcess (шаблон "Банкирование")

Создаёт 20 контейнеров типа CRYOVIAL-2ML: 

container_code = CRYO-042-MCB-1, CRYO-042-MCB-2...

status = 'pending'

Печатает этикетки для криовиал (мелкий формат для криогенных условий)

**Шаг 2: Выполнение процесса ****банкирования**

(Аналогично пассированию: подсчёт клеток, центрифугирование, добавление криопротектора, распределение по виалам)

**Шаг 3: Заморозка**

**Последний шаг процесса:**

Шаг 8/8: Заморозка

Описание: Поместите виалы в контролируемую систему заморозки (CRF)

Режим заморозки: [Программа 1: -1°C/min до -80°C]

[Сканировать QR-код CRF]

[Завершить процесс]

**Оператор:**

Сканирует QR-код контролируемой системы заморозки (CRF)

Нажимает "Завершить процесс"

**Система:**

Обновляет контейнеры: 

status = 'frozen'

frozen_at = NOW()

location_id = Freezer -80°C, Rack 5, Box 2

Обновляет культуру: 

Если это MCB → добавляет в поле mcb_created = true

Создаёт автозадачу для QC: 

"Провести post-thaw тест для MCB-2024-042-001 (размораживание одной виалы для проверки)"

**Шаг 4: QC тестирование (асинхронно)**

**QC:**

Размораживает 1-2 виалы из MCB

Проверяет жизнеспособность, стерильность

Если тесты OK → создаёт QCTest: 

test_type = 'post_thaw_viability'

result_status = 'passed'

result_value = "Viability 92%"

**Шаг 5: Утверждение QP**

**QP:**

Проверяет все тесты QC

Проверяет документацию (протоколы заморозки)

Если всё OK → нажимает "Утвердить MCB"

**Система:**

Обновляет культуру: 

mcb_approved_by_qp_user_id = QP ID

mcb_approved_at = NOW()

Уведомление команде:

✅ MCB-2024-042 утверждён QP

Доступно 20 виал для производства

**3.4.4 Постусловия**

MCB/WCB создан и заморожен

Криовиалы с QR-кодами в морозильнике

QC тесты пройдены

QP утвердил (для MCB)

**3.5 Процесс: Размораживание WCB**

**3.5.1 Участники**

**Operator**: Размораживает виалу

**3.5.2 Предусловия**

MCB утверждён QP

Есть замороженные контейнеры (WCB)

**3.5.3 Шаги процесса**

**Шаг 1: Инициация размораживания**

**Оператор:**

Переходит в раздел "Банки клеток"

Выбирает WCB (например, "WCB-042-001")

Нажимает "Разморозить"

Система предлагает шаблон "Размораживание WCB (SOP-043 v1.0)"

Выбирает: 

Контейнеры для размораживания: [CRYO-042-WCB-5] (чекбокс)

Новый контейнер для посева: [T75]

Среда: [выбор по FEFO]

Локация: [Incubator INC-01]

Нажимает "Начать процесс"

**Система:**

Создаёт ExecutedProcess

Создаёт новый контейнер: 

container_code = T75-042-P5-1 (продолжение пассажей)

status = 'pending'

Печатает этикетку

**Шаг 2: Выполнение процесса размораживания**

(Шаги: извлечение из морозильника, размораживание на водяной бане, разведение, посев, инкубация)

**Последний шаг:**

Шаг 6/6: Инкубация

Описание: Поместите контейнер в инкубатор

[Сканировать QR-код инкубатора]

[Завершить процесс]

**Система:**

Обновляет контейнеры: 

Исходная криовиала: status = 'thawed', thawed_at = NOW()

Новый контейнер: status = 'active', location_id = инкубатор

Обновляет культуру: 

current_passage = 5 (если WCB был заморожен на P4)

Успешное сообщение

**3.5.4 Постусловия**

Криовиала разморожена (статус thawed)

Клетки посеяны в новый контейнер (статус active)

Культура продолжает жизненный цикл

**3.6 Процесс: Приготовление комбинированной среды**

**3.6.1 Участники**

**Operator**: Готовит среду

**QC**: Проверяет стерильность (после приготовления)

**3.6.2 Предусловия**

Есть рецепт среды (MediaRecipe)

Все компоненты (base medium, serum, additives) в наличии и не просрочены

**3.6.3 Шаги процесса**

**Шаг 1: Создание рецепта (однократно, ****Admin****)**

**Admin****:**

Переходит в "Материалы" → "Рецепты сред" → "Создать рецепт"

Заполняет: 

Название: "DMEM с 10% FBS"

Тип: Combined

Компоненты: 

DMEM (base medium): 90% (900 ml на 1 литр)

FBS (serum): 10% (100 ml на 1 литр)

Penicillin/Streptomycin (antibiotic): 10 ml на 1 литр

Срок хранения: 30 дней

Условия хранения: +2°C до +8°C

SOP: SOP-MEDIA-001 v2.0

Сохраняет

**Система:**

Создаёт MediaRecipe + MediaRecipeComponent (3 записи)

**Шаг 2: Приготовление партии среды**

**Operator****:**

Переходит в "Материалы" → "Комбинированные среды" → "Приготовить партию"

Выбирает рецепт: "DMEM с 10% FBS"

Указывает: 

Объём: 1000 ml

Компоненты (система автоматически предлагает по FEFO): 

DMEM: Партия DMEM-2024-012 (LOT ABC123, exp 2024-06-01) ⭐

FBS: Партия FBS-2024-008 (LOT FBS456, exp 2024-04-01) ⭐

P/S: Партия PEN-2024-005 (LOT PS789, exp 2024-05-01)

Локация хранения: Refrigerator-02, Shelf 3

Нажимает "Создать партию"

**Система:**

Валидация:

Все компоненты существуют и status = 'active'

Остатков достаточно: 

DMEM-2024-012.quantity_remaining >= 900 ml ✅

FBS-2024-008.quantity_remaining >= 100 ml ✅

PEN-2024-005.quantity_remaining >= 10 ml ✅

Срок годности всех компонентов >= сегодня ✅

Расчёт expiry_date партии:

Находит минимальный expiry_date из компонентов: 

DMEM: 2024-06-01

FBS: 2024-04-01 ← минимальный

P/S: 2024-05-01

expiry_date партии = 2024-04-01 (или меньше, если оператор указал)

Создание записей:

CombinedMediaBatch: 

batch_code = MED-2024-050 (автогенерация)

media_recipe_id = ID рецепта

preparation_date = сегодня

expiry_date = 2024-04-01

volume_ml = 1000

volume_remaining_ml = 1000

sterility_status = 'pending'

status = 'quarantine' (по умолчанию до проверки QC)

prepared_by_user_id = Operator ID

CombinedMediaBatchComponent (3 записи): 

Компонент 1: DMEM-2024-012, 900 ml

Компонент 2: FBS-2024-008, 100 ml

Компонент 3: PEN-2024-005, 10 ml

Создание транзакций (списание компонентов):

MediaComponentTransaction (3 записи): 

DMEM-2024-012: -900 ml

FBS-2024-008: -100 ml

PEN-2024-005: -10 ml

Обновление остатков компонентов:

DMEM-2024-012.quantity_remaining -= 900

FBS-2024-008.quantity_remaining -= 100

PEN-2024-005.quantity_remaining -= 10

Печать QR-кода для бутыли:

QR содержит:

{

  "batch_id": 50,

  "batch_code": "MED-2024-050",

  "recipe_name": "DMEM с 10% FBS",

  "expiry_date": "2024-04-01",

  "volume_ml": 1000

}

Создание автозадачи для QC:

task_type = 'sterility_test'

description = "Провести тест стерильности среды MED-2024-050"

due_date = сегодня + 7 дней

Успешное сообщение:

✅ Партия среды MED-2024-050 создана

Объём: 1000 ml

Срок годности: 2024-04-01

Статус: Карантин (ожидает проверки QC)

QR-код распечатан

**Шаг 3: QC проверка стерильности (через 7 дней)**

**QC:**

Проводит тест стерильности (инкубация образца в питательной среде)

Результат: стерильна ✅

В системе: переходит в "QC Тесты" → находит тест для MED-2024-050

Обновляет: 

result_status = 'passed'

Нажимает "Утвердить"

**Система:**

Обновляет CombinedMediaBatch: 

sterility_status = 'passed'

status = 'active' (теперь доступна для использования)

Уведомление операторам:

✅ Среда MED-2024-050 прошла проверку стерильности

Доступна для использования в процессах

**3.6.4 Постусловия**

Партия среды создана, компоненты списаны

QR-код распечатан

Среда на карантине до проверки QC

После проверки → статус active, доступна для использования

**3.7 Процесс: Карантин среды при контаминации культуры**

**Новая логика** (согласно замечанию 3 и 2.1)

**3.7.1 Триггер**

Culture.status = 'contaminated' (оператор или автоматическая проверка обнаружила контаминацию)

**3.7.2 Автоматические действия системы**

**Шаг 1: Поиск использованной среды**

**Система:**

Находит последний ExecutedStep для этой культуры, где step_type = 'feeding' или 'passage'

Извлекает media_batch_used_id (ID партии среды)

**Шаг 2: Карантин среды**

**Если это ****CombinedMediaBatch****:**

Обновляет партию:

CombinedMediaBatch.status = 'quarantined'

**Базовые компоненты остаются ****active** (пока не доказано обратное)

Создаёт Investigation Task для QC:

Тип: Расследование контаминации

Приоритет: Критический

Культура: BMCP-C-2024-042

Среда: MED-2024-050 (DMEM + 10% FBS)

Задачи:

1. Проверить стерильность готовой среды MED-2024-050:

   - Инкубация образца в питательной среде (7 дней)

2. Если готовая среда стерильна:

   - Проверить стерильность компонентов:

     ✓ DMEM-2024-012 (LOT ABC123)

     ✓ FBS-2024-008 (LOT FBS456)

     ✓ PEN-2024-005 (LOT PS789)

3. Проверить логи приготовления:

   - Соблюдён ли SOP?

   - Кто готовил?

   - Условия стерильности ламинарного бокса?

4. Принять решение:

   - Если виновата готовая среда → только она в карантин (компоненты OK)

   - Если виноват компонент → карантин всех партий этого компонента + cascade

Уведомление QC (Telegram + UI):

⚠️ КОНТАМИНАЦИЯ: Требуется расследование

Культура BMCP-C-2024-042 контаминирована

Среда MED-2024-050 переведена на карантин

Действия:

1. Проверьте стерильность среды (инкубация 7 дней)

2. Определите источник контаминации

3. Примите решение по компонентам

[Открыть задачу расследования]

**Шаг 3: QC расследование (через 7 дней)**

**Вариант A: Виновата готовая среда (проблема стерильности приготовления)**

**QC:**

Тест стерильности готовой среды: **контаминирована** ❌

Тесты компонентов: все **стерильны** ✅

Вывод: нарушена стерильность при приготовлении среды

В задаче расследования выбирает: 

Источник: "Готовая среда (нарушение SOP приготовления)"

Root Cause: "Вероятно, нарушена стерильность ламинарного бокса LAM-02 при приготовлении"

Corrective Action: "Провести дополнительную дезинфекцию LAM-02, повторить обучение оператора"

Preventive Action: "Ввести дополнительную проверку стерильности бокса перед приготовлением сред"

Нажимает "Закрыть расследование"

**Система:**

CombinedMediaBatch.status остаётся 'quarantined' (потом → 'disposed')

Компоненты (MediaComponentBatch) **остаются ****status**** = '****active****'** (можно использовать в новых партиях)

Создаёт Deviation для процесса приготовления среды (если не было)

Уведомление команде

**Вариант B: Виноват компонент (например, сыворотка)**

**QC:**

Тест стерильности готовой среды: **контаминирована** ❌

Тесты компонентов: 

DMEM-2024-012: **стерилен** ✅

FBS-2024-008: **контаминирован** ❌ ← Источник!

PEN-2024-005: **стерилен** ✅

Вывод: контаминирована сыворотка из партии FBS-2024-008 (LOT FBS456)

В задаче выбирает: 

Источник: "Компонент: FBS-2024-008 (LOT FBS456)"

Root Cause: "Контаминация сыворотки от поставщика или нарушение хранения"

Нажимает "Применить карантин к компоненту"

**Система (****cascade**** карантин):**

Обновляет виновный компонент:

FBS-2024-008.status = 'quarantined'

Находит все другие партии сыворотки с тем же lot_number (LOT FBS456):

Если есть другие MediaComponentBatch с lot_number = 'FBS456' → все на карантин

Находит все CombinedMediaBatch, где использовался FBS-2024-008:

Через CombinedMediaBatchComponent.media_component_batch_id = FBS-2024-008

Все эти готовые среды → status = 'quarantined'

Находит все Culture, которые использовали эти среды:

Через ExecutedStep.media_batch_used_id IN (список готовых сред)

Все эти культуры → status = 'hold' + risk_flag = 'critical'

Создаёт Deviation для каждой культуры

Уведомление команде (включая QP):

🚨 КРИТИЧЕСКИЙ КАРАНТИН: Cascade

Источник: Сыворотка FBS-2024-008 (LOT FBS456)

На карантин отправлены:

• 1 партия компонента (FBS-2024-008)

• 3 партии готовых сред (MED-2024-050, MED-2024-051, MED-2024-052)

• 5 культур (BMCP-C-2024-042, BMCP-C-2024-043, BMCP-C-2024-044, ...)

Требуется решение QP по каждой культуре.

[Список культур на карантине]

Для каждой культуры на карантине → QP получает уведомление (Telegram) с кнопками решения (аналогично Deviation workflow)

**3.7.3 Постусловия**

При контаминации культуры автоматически на карантин идёт **только готовая среда**

Базовые компоненты **остаются активными** до расследования QC

QC определяет источник → если виноват компонент → **cascade**** карантин** всех связанных сущностей (среды + культуры)

**4. ДЕТАЛЬНЫЕ ПОЛЬЗОВАТЕЛЬСКИЕ СЦЕНАРИИ**

**4.1 Общий жизненный цикл культуры**

1. ДОНОР

   ↓

   [Operator регистрирует донора]

   ↓

2. ДОНАЦИЯ

   ↓

   [Operator регистрирует донацию]

   [Celery задача: уведомление QP через 4 часа]

   [QP асинхронно проверяет документы, но не блокирует процесс]

   ↓

3. ПЕРВИЧНАЯ КУЛЬТУРА (P0)

   ↓

   [Operator создаёт культуру из донации]

   [Создаёт контейнеры T75-042-P0-1, P0-2...]

   [Печатает QR-этикетки]

   [Помещает в инкубатор]

   ↓

4. ПАССИРОВАНИЕ (P1, P2, P3...)

   ↓

   [Operator выполняет процесс "Пассирование"]

   [Сканирует оборудование (ламинарный бокс, инкубатор)]

   [Вводит данные (концентрация, жизнеспособность)]

   [Система автоматически проверяет CCA]

   [Если CCA fail → создаёт Deviation → уведомляет QP (Telegram)]

   [QP принимает решение: Продолжить / Карантин / Утилизировать]

   [Сканирует партию среды (FEFO валидация)]

   [Создаёт новые контейнеры T75-042-P4-1, P4-2...]

   [Печатает этикетки]

   ↓

5. БАНКИРОВАНИЕ MCB (после P3-P5)

   ↓

   [Operator выполняет процесс "Банкирование"]

   [Создаёт криовиалы CRYO-042-MCB-1, MCB-2...MCB-20]

   [Замораживает в CRF]

   [Помещает в морозильник -80°C]

   [QC проводит post-thaw тест]

   [QP утверждает MCB]

   ↓

6. РАЗМОРАЖИВАНИЕ WCB

   ↓

   [Operator размораживает WCB]

   [Создаёт новый контейнер T75-042-P5-1]

   [Продолжает пассирование (P6, P7...)]

   ↓

7. ПРОИЗВОДСТВО ДЛЯ ЗАКАЗА

   ↓

   [Operator пассирует до нужного количества]

   [QC проводит финальные тесты (стерильность, идентичность, потентность)]

   ↓

8. ВЫДАЧА

   ↓

   [Operator создаёт Release]

   [QP проверяет все тесты QC]

   [QP утверждает выдачу]

   [Генерируется Certificate of Analysis]

   [Контейнеры передаются заказчику]

   [Получатель подписывает]

   ↓

9. КОНЕЦ (Контейнеры использованы заказчиком)

**4.2 Сценарий: Превышение критического критерия (CCA ****Fail****) с ****Telegram****-уведомлением QP**

**Детальный ****flow****:**

**1. ****Operator**** выполняет шаг "Подсчёт клеток" в процессе ****пассирования**

**UI:**

Шаг 3/8: Подсчёт клеток ⚠️ КРИТИЧЕСКИЙ ШАГ

Контейнер T75-042-P3-1:

- Концентрация клеток (cells/ml)*: 5000000

- Жизнеспособность (%)*: 75

[Завершить шаг]

**Operator**** вводит данные и нажимает "Завершить шаг"**

**2. ****Backend**** автоматически проверяет CCA**

# Псевдокод

step = ExecutedStep(

    recorded_parameters={

        "cell_count": 5000000,

        "viability": 75

    }

)

cca_rules = ProcessTemplateStep.cca_rules  # {"viability": {"min": 80, "severity": "critical"}}

results = {}

for param, rule in cca_rules.items():

    value = step.recorded_parameters[param]

    threshold = rule['min']

    passed = value >= threshold

    results[param] = {

        "value": value,

        "threshold": threshold,

        "passed": passed,

        "severity": rule['severity'] if not passed else None

    }

step.cca_passed = all(r['passed'] for r in results.values())

step.cca_results = results

if not step.cca_passed:

    # CCA не пройден → создаём Deviation

    deviation = Deviation(

        deviation_code=generate_code("DEV"),

        deviation_type='cca_fail',

        severity='critical',  # Из CCA rules

        culture_id=culture.id,

        container_id=container.id,

        executed_step_id=step.id,

        description=f"Жизнеспособность клеток ({value}%) ниже порога ({threshold}%)",

        detected_by_user_id=operator.id,

        qp_review_required=True,

        status='open'

    )

    deviation.save()

    # Обновляем культуру

    culture.risk_flag = 'at_risk'

    culture.risk_flag_reason = f"CCA fail: viability {value}% < {threshold}%"

    culture.risk_flag_set_at = now()

    culture.save()

    # Блокируем контейнер

    container.status = 'blocked'

    container.save()

    # Уведомляем QP

    notify_qp_deviation(deviation)

**3. Система отправляет уведомление в ****Telegram**** всем QP**

**Telegram bot (****aiogram****):**

# backend/app/telegram/notifications.py

async def notify_qp_deviation(deviation):

    qp_users = User.filter(role='qp', is_active=True)

    for qp in qp_users:

        telegram_user = TelegramUser.get(user_id=qp.id)

        if not telegram_user or not telegram_user.notifications_enabled:

            continue

        # Формируем сообщение

        message = f"""

⚠️ КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ

{deviation.deviation_code}

Тип: Превышение порога CCA

Серьёзность: {deviation.severity.upper()}

Культура: {deviation.culture.culture_code} ({deviation.culture.cell_type}, P{deviation.culture.current_passage})

Контейнер: {deviation.container.container_code}

Проблема: {deviation.description}

Дата: {deviation.detected_at.strftime('%d.%m.%Y %H:%M')}

Обнаружил: {deviation.detected_by_user.full_name}

Требуется решение QP

"""

        # Inline keyboard с кнопками

        keyboard = InlineKeyboardMarkup(inline_keyboard=[

            [

                InlineKeyboardButton(text="✅ Продолжить", callback_data=f"dev_{deviation.id}_continue"),

                InlineKeyboardButton(text="⏸️ Карантин", callback_data=f"dev_{deviation.id}_quarantine")

            ],

            [

                InlineKeyboardButton(text="🗑️ Утилизировать", callback_data=f"dev_{deviation.id}_dispose")

            ],

            [

                InlineKeyboardButton(text="🔗 Открыть в системе", url=f"https://bmcp.lab/deviations/{deviation.deviation_code}")

            ]

        ])

        await bot.send_message(

            chat_id=telegram_user.telegram_id,

            text=message,

            reply_markup=keyboard

        )

        # Обновляем Deviation

        deviation.qp_notified_at = now()

        deviation.save()

**4. QP получает сообщение в ****Telegram**

⚠️ КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ

DEV-2024-088

Тип: Превышение порога CCA

Серьёзность: CRITICAL

Культура: BMCP-C-2024-042 (MSC, P3)

Контейнер: T75-042-P3-2

Проблема: Жизнеспособность клеток (75%) ниже порога (80%)

Дата: 17.02.2024 15:30

Обнаружил: Иван Петров

Требуется решение QP

[✅ Продолжить] [⏸️ Карантин]

[🗑️ Утилизировать]

[🔗 Открыть в системе]

**5. QP нажимает кнопку (например, "Продолжить")**

**Telegram bot ****обрабатывает**** callback:**

# backend/app/telegram/handlers/deviation_handlers.py

@router.callback_query(F.data.startswith("dev_"))

async def handle_deviation_decision(callback: CallbackQuery, state: FSMContext):

    # Парсим callback_data: "dev_123_continue"

    parts = callback.data.split("_")

    deviation_id = int(parts[1])

    decision = parts[2]  # continue, quarantine, dispose

    deviation = Deviation.get(deviation_id)

    qp_user = get_user_by_telegram_id(callback.from_user.id)

    # Запрашиваем комментарий

    await callback.message.answer(

        f"Вы выбрали: {DECISION_LABELS[decision]}\n\n"

        f"Введите комментарий (обязательно):",

        reply_markup=ForceReply()

    )

    # Сохраняем состояние в FSM

    await state.set_state(DeviationReviewStates.waiting_for_comment)

    await state.update_data(

        deviation_id=deviation_id,

        decision=decision,

        qp_user_id=qp_user.id

    )

    await callback.answer()

@router.message(DeviationReviewStates.waiting_for_comment)

async def process_deviation_comment(message: Message, state: FSMContext):

    data = await state.get_data()

    deviation_id = data['deviation_id']

    decision = data['decision']

    qp_user_id = data['qp_user_id']

    comment = message.text

    # Вызываем backend API

    result = await api_client.review_deviation(

        deviation_id=deviation_id,

        qp_user_id=qp_user_id,

        decision=decision,

        comment=comment

    )

    if result['success']:

        await message.answer(

            f"✅ Ваше решение сохранено\n"

            f"Deviation {result['deviation_code']} обновлён\n\n"

            f"Решение: {DECISION_LABELS[decision]}\n"

            f"Комментарий: {comment}"

        )

        # Уведомляем оператора (UI + Telegram если есть)

        await notify_operator_deviation_resolved(result['deviation'])

    else:

        await message.answer(f"❌ Ошибка: {result['error']}")

    await state.clear()

**6. Backend API ****обрабатывает**** ****решение**** QP**

# backend/app/api/v1/deviations.py

@router.post("/deviations/{deviation_id}/review")

async def review_deviation(

    deviation_id: int,

    review: DeviationReviewRequest,  # {qp_user_id, decision, comment}

    current_user: User = Depends(get_current_user)

):

    deviation = Deviation.get(deviation_id)

    if not deviation:

        raise HTTPException(404, "Deviation not found")

    # Проверка прав (только QP)

    if current_user.role != 'qp':

        raise HTTPException(403, "Only QP can review deviations")

    # Обновляем Deviation

    deviation.qp_reviewed_by_user_id = review.qp_user_id

    deviation.qp_reviewed_at = now()

    deviation.qp_review_decision = review.decision

    deviation.qp_review_comments = review.comment

    deviation.status = 'resolved'

    deviation.resolved_at = now()

    deviation.save()

    # Применяем решение

    if review.decision == 'continue':

        # Разблокируем контейнер

        deviation.container.status = 'active'

        deviation.container.save()

        # Снимаем флаг риска

        deviation.culture.risk_flag = 'none'

        deviation.culture.risk_flag_cleared_at = now()

        deviation.culture.save()

        # Создаём задачу повторной проверки

        Task.create(

            task_type='qc_check',

            due_date=now() + timedelta(hours=48),

            description=f"Повторная проверка жизнеспособности культуры {deviation.culture.culture_code}",

            assigned_to_user_id=deviation.detected_by_user_id

        )

    elif review.decision == 'quarantine':

        # Карантин конт

    quantity_remaining >= required_quantity,

    expiry_date >= today

).order_by('expiry_date')  # Сортировка по сроку годности (FEFO)

# Предлагаем первую партию

suggested_batch = available_batches[0]

# В UI помечаем звёздочкой ⭐

**Валидация:**

Рецепт существует

Все компоненты доступны (статус active, не просрочены, достаточно остатков)

Расчёт expiry_date готовой среды: минимальный из компонентов (или указанный оператором, если меньше)

**UI:** "Материалы" → "Комбинированные среды" → "Приготовить партию"

**FR-MEDIA-COMB-003: FEFO валидация при использовании среды в процессе**

**Описание**: Когда оператор выбирает партию среды для использования (feeding, passage), система проверяет FEFO и предупреждает, если выбрана не оптимальная партия.

**Триггер:**

Operator сканирует QR-код бутыли среды ИЛИ выбирает партию из списка

**Логика****:**

selected_batch = CombinedMediaBatch.get(scanned_batch_id)

# Поиск партий с более ранним сроком

earlier_batches = CombinedMediaBatch.filter(

    media_recipe_id=selected_batch.media_recipe_id,

    status='active',

    volume_remaining_ml >= required_volume,

    expiry_date < selected_batch.expiry_date

)

if earlier_batches.exists():

    # Предупреждение

    show_warning(

        f"⚠️ FEFO: Доступна партия {earlier_batches[0].batch_code} "

        f"с более ранним сроком ({earlier_batches[0].expiry_date.strftime('%d.%m.%Y')}). "

        f"Рекомендуется использовать её."

    )

    # Кнопки

    [Использовать рекомендованную партию {earlier_batches[0].batch_code}]

    [Всё равно использовать {selected_batch.batch_code}]

    # Если оператор выбирает "Всё равно использовать" → создаём minor Deviation

    if user_choice == 'use_selected_anyway':

        Deviation.create(

            deviation_type='process_violation',

            severity='minor',

            description=f"Нарушение FEFO: использована среда {selected_batch.batch_code} (exp {selected_batch.expiry_date}) вместо {earlier_batches[0].batch_code} (exp {earlier_batches[0].expiry_date})",

            qp_review_required=False  # Minor → не требует немедленного QP review

        )

else:

    # Всё OK, зелёная галочка

    show_success(f"✅ FEFO соблюдён: партия {selected_batch.batch_code}")

**UI****:** Отображается при выборе среды в шаге процесса

**FR-MEDIA-COMB-004: Карантин среды при контаминации культуры (автоматический)**

**Описание**: При обнаружении контаминации культуры система автоматически переводит использованную среду на карантин и создаёт задачу расследования для QC.

**Триггер:**

Culture.status = 'contaminated' (вручную оператором ИЛИ автоматически при Deviation type='contamination')

**Логика:**

# 1. Найти последний шаг feeding/passage для этой культуры

last_step = ExecutedStep.filter(

    culture_id=culture.id,

    step_type__in=['feeding', 'passage']

).order_by('-completed_at').first()

if not last_step or not last_step.media_batch_used_id:

    return  # Среда не использовалась (или не записано)

# 2. Карантин среды

media_batch = CombinedMediaBatch.get(last_step.media_batch_used_id)

media_batch.status = 'quarantined'

media_batch.save()

# 3. Базовые компоненты остаются active (пока QC не определит источник)

# 4. Создаём Investigation Task для QC

Task.create(

    task_type='investigation',

    priority='high',

    title=f"Расследование контаминации культуры {culture.culture_code}",

    description=f"""

Определить источник контаминации:

- Готовая среда {media_batch.batch_code}?

- Компоненты (base medium, serum, additives)?

Действия:

1. Проверить стерильность готовой среды (инкубация 7 дней)

2. Если готовая среда чистая → проверить компоненты

3. Проверить логи приготовления среды

4. Принять решение по компонентам (если виноват компонент → cascade карантин)

    """,

    assigned_to_role='qc',

    culture_id=culture.id,

    related_entity_type='CombinedMediaBatch',

    related_entity_id=media_batch.id

)

# 5. Уведомление QC

notify_qc(f"Требуется расследование контаминации культуры {culture.culture_code}")

**Постусловие:**

Готовая среда → status = 'quarantined'

Базовые компоненты → status = 'active' (пока)

QC получает задачу расследования

**FR-MEDIA-COMB-005: ****Cascade**** карантин при обнаружении контаминированного компонента**

**Описание**: Если QC определил, что контаминирован один из компонентов (например, сыворотка), система автоматически переводит на карантин все связанные сущности.

**Триггер:**

QC в задаче расследования выбирает "Источник: Компонент X" и нажимает "Применить карантин к компоненту"

**Вход:**

media_component_batch_id (виновный компонент)

lot_number (LOT поставщика, для поиска других партий)

**Логика****:**

component_batch = MediaComponentBatch.get(media_component_batch_id)

# 1. Карантин виновного компонента

component_batch.status = 'quarantined'

component_batch.save()

# 2. Найти все другие партии с тем же LOT number

related_batches = MediaComponentBatch.filter(

    lot_number=component_batch.lot_number,

    status='active'

)

for batch in related_batches:

    batch.status = 'quarantined'

    batch.save()

# 3. Найти все готовые среды (CombinedMediaBatch), использовавшие этот компонент

affected_media = CombinedMediaBatch.join(CombinedMediaBatchComponent).filter(

    CombinedMediaBatchComponent.media_component_batch_id.in_(

        [component_batch.id] + [b.id for b in related_batches]

    ),

    CombinedMediaBatch.status='active'

)

for media in affected_media:

    media.status = 'quarantined'

    media.save()

# 4. Найти все культуры, использовавшие эти среды

affected_cultures = Culture.join(ExecutedStep).filter(

    ExecutedStep.media_batch_used_id.in_([m.id for m in affected_media])

).distinct()

for culture in affected_cultures:

    culture.status = 'hold'

    culture.risk_flag = 'critical'

    culture.risk_flag_reason = f"Карантин среды: использован контаминированный компонент {component_batch.batch_code} (LOT {component_batch.lot_number})"

    culture.save()

    # Создаём Deviation для каждой культуры

    Deviation.create(

        deviation_type='contamination',

        severity='critical',

        culture_id=culture.id,

        description=f"Культура на карантине: использована среда с контаминированным компонентом {component_batch.batch_code}",

        qp_review_required=True,

        status='open'

    )

    # Уведомление QP

    notify_qp_deviation(deviation)

# 5. Отчёт о cascade карантине

report = {

    "component": component_batch.batch_code,

    "lot_number": component_batch.lot_number,

    "quarantined_components": len(related_batches) + 1,

    "quarantined_media": len(affected_media),

    "affected_cultures": len(affected_cultures)

}

# Уведомление команде (включая QP)

notify_team_cascade_quarantine(report)

**Постусловие:**

Все партии компонента с valid: {equipment.calibration_valid_until.strftime('%d.%m.%Y')}^FS
^XZ
"""
send_to_printer(zpl_command)
elif printer_type == 'dymo': 

**Генерируем**** PDF ****с**** QR-****кодом**

pdf = generate_label_pdf(qr_image, equipment)
send_to_printer(pdf)

**Audit log**

AuditLog.create(
user_id=,
action_type='print',
entity_type='Equipment',
entity_id=,
comment=f"Label printed for equipment {equipment.equipment_code}"
)

**Выход:**

- QR-этикетка распечатана

- Audit log записан

**Формат этикетки:**

┌────────────────────────┐
│ [QR-код] │
│ │
│ INC-01 │
│ Инкубатор Thermo │
│ Cal valid: 15.06.2024 │
└────────────────────────┘

---

#### FR-EQUIPMENT-003: Сканирование оборудования при выполнении критического шага

**Описание**: Для критических шагов процесса (помеченных `requires_equipment_scan = true`) оператор обязан отсканировать QR-код оборудования перед выполнением шага.

**Триггер:**

- Operator выполняет шаг процесса, где `ProcessTemplateStep.requires_equipment_scan = true`

**UI:**

Шаг 1/8: Подготовка
Описание: Работайте в ламинарном боксе LAM-02 (согласно SOP-042 v2.1)

Ожидаемое оборудование: LAM-02 (Laminar Hood)

[📷 Сканировать QR-код оборудования]

**Логика (после сканирования):**

```python

# Парсинг QR-кода

scanned_data = json.loads(qr_code_content)

equipment_id = scanned_data['equipment_id']

equipment_code = scanned_data['equipment_code']

calibration_valid_until = datetime.fromisoformat(scanned_data['calibration_valid_until'])

# Получаем оборудование из БД

equipment = Equipment.get(equipment_id)

# Валидация

errors = []

# 1. Оборудование существует?

if not equipment:

    errors.append(f"❌ Оборудование {equipment_code} не найдено в системе")

# 2. Соответствует ожидаемому? (если указано в шаблоне)

if step.expected_equipment_id and equipment.id != step.expected_equipment_id:

    errors.append(

        f"❌ Отсканировано оборудование {equipment.equipment_code}, "

        f"но требуется {step.expected_equipment.equipment_code}"

    )

# 3. Калибровка не просрочена?

if calibration_valid_until < date.today():

    errors.append(

        f"❌ Оборудование {equipment.equipment_code}: "

        f"истёк срок калибровки ({calibration_valid_until.strftime('%d.%m.%Y')})"

    )

# 4. Статус operational?

if equipment.status != 'operational':

    errors.append(

        f"❌ Оборудование {equipment.equipment_code} в статусе '{equipment.status}' "

        f"(требуется 'operational')"

    )

# Результат валидации

if errors:

    # Блокировка шага

    show_errors(errors)

    disable_button("Завершить шаг")

    show_action_button("Сообщить о проблеме", action=escalate_to_supervisor)

else:

    # Успешное сканирование

    show_success(f"✅ Оборудование {equipment.equipment_code} проверено")

    # Сохраняем в ExecutedStep

    executed_step.scanned_equipment_id = equipment.id

    executed_step.equipment_scan_timestamp = now()

    executed_step.save()

    # Разблокируем продолжение шага

    enable_button("Завершить шаг")

**Постусловие:**

Если валидация прошла: ExecutedStep.scanned_equipment_id сохранён, шаг можно продолжить

Если не прошла: шаг заблокирован, оператор не может продолжить без escalation

**UI (успешное сканирование):**

Шаг 1/8: Подготовка

✅ Оборудование: LAM-02 (Laminar Hood) проверено

Последняя калибровка: 15.01.2024

Калибровка действительна до: 15.06.2024

[Продолжить к следующему полю]

**UI (ошибка валидации):**

Шаг 1/8: Подготовка

❌ ОШИБКА ВАЛИДАЦИИ

❌ Оборудование LAM-02: истёк срок калибровки (15.02.2024)

Действия:

[Сообщить о проблеме супервизору]

[Отсканировать другое оборудование]

**5.3 Модуль: Донация и QP проверка (обновлённая логика)**

**FR-DONATION-001: Создание донации без блокирующего QP ****approval**

**Описание**: Operator создаёт донацию, которая сразу доступна для работы. QP проверяет документы асинхронно (не блокирует процесс).

**Изменения по сравнению с прошлой версией:**

Убрано обязательное ожидание qp_approved_at перед созданием культуры

ДобавленНовая донация {donation.donation_code} требует проверки документов.\n\n"
f"Донор: {donation.donor.donor_code}\n"
f"Дата: {donation.donation_date.strftime('%d.%m.%Y')}\n"
f"Тип ткани: {donation.tissue_type}\n\n"
f""
)

  # Email (дублирование)

  send_email(

      qp.email,

      subject=f"Проверка донации {donation.donation_code}",

      body=f"Новая донация требует проверки документов..."

  )

**QP действия:**

1. Получает уведомление (Telegram + Email)

2. Открывает карточку донации в системе

3. Проверяет:

   - Согласие загружено и подписано

   - Серология заполнена (или запланирована)

   - Все данные корректны

4. **Если всё ОК:**

   - Нажимает "✅ Подтвердить проверку"

   - Вводит комментарии (опционально)

   - `donation.qp_verified = true`, `qp_verified_by_user_id = QP ID`, `qp_verified_at = NOW()`

5. **Если есть проблема:**

   - Создаёт Deviation:

     - `deviation_type = 'process_violation'`

     - `severity = 'major'`

     - `description = "Отсутствует подписанное согласие донора"`

   - Если уже создана культура из этой донации → культура автоматически переходит в `status = 'hold'`

   - Уведомление оператору

**Постусловие:**

- Донация проверена (но это не влияет на уже созданные культуры, если всё OK)

- Если проблема → Deviation создан → связанные культуры на `hold`

---

### 5.4 Модуль: Отклонения (Deviations)

#### FR-DEVIATION-001: Автоматическое создание Deviation при CCA fail

**Описание**: При провале CCA проверки система автоматически создаёт Deviation.

**Реализовано в разделе 3.3.3, шаг 2.3**

---

#### FR-DEVIATION-002: Уведомление QP через Telegram

**Описание**: При создании критического Deviation QP получает уведомление в Telegram с inline кнопками для принятия решения.

**Реализовано в разделе 4.2, шаги 3-5**

---

#### FR-DEVIATION-003: Принятие решения QP (Telegram или Web)

**Описание**: QP может принять решение по Deviation двумя способами:

1. Через Telegram (inline кнопки + ввод комментария)

2. Через веб-интерфейс (карточка Deviation)

**Реализовано в разделе 4.2, шаги 5-7 (Telegram) и раздел 4.3 (Web)**

---

### 5.5 Модуль: Прослеживаемость (Traceability)

#### FR-TRACE-001: Полная история культуры (от донора до выдачи)

**Описание**: Для любой культуры можно просмотреть полную историю: донор → донация → все процессы → все контейнеры → QC тесты → отклонения → выдача.

**UI:** Карточка культуры → вкладка "История"

**Логика:**

```python

# GET /api/v1/cultures/{culture_id}/history

def get_culture_history(culture_id):

    culture = Culture.get(culture_id)

    history = {

        "donor": {

            "donor_code": culture.donation.donor.donor_code,

            "birth_year": culture.donation.donor.birth_year,

            "sex": culture.donation.donor.sex

        },

        "donation": {

            "donation_code": culture.donation.donation_code,

            "donation_date": culture.donation.donation_date,

            "tissue_type": culture.donation.tissue_type,

            "qp_verified": culture.donation.qp_verified,

            "qp_verified_at": culture.donation.qp_verified_at

        },

        "processes": ExecutedProcess.filter(culture_id=culture.id).all(),

        "steps": ExecutedStep.join(ExecutedProcess).filter(

            ExecutedProcess.culture_id=culture.id

        ).all(),

        "containers": Container.filter(culture_id=culture.id).all(),

        "qc_tests": QCTest.filter(culture_id=culture.id).all(),

        "deviations": Deviation.filter(culture_id=culture.id).all(),

        "releases": Release.filter(culture_id=culture.id).all()

    }

    return history

**UI ****отображение****:**

┌────────────────────────────────────────────────────────────┐

│ ИСТОРИЯ КУЛЬТУРЫ BMCP-C-2024-042                           │

├────────────────────────────────────────────────────────────┤

│                                                            │

│ 📍 TIMELINE                                                │

│                                                            │

│ ● 10.01.2024 - Донация DONAT-2024-010                     │

│   Донор: DON-2023-005 (М, 1985)                           │

│   Ткань: Костный мозг, 50 ml                              │

│   QP проверка: ✅ 10.01.2024 15:00 (Петров А.)            │

│                                                            │

│ ● 11.01.2024 - Первичная культура (P0)                    │

│   Контейнеры: T75-042-P0-1, P0-2                          │

│   Среда: MED-2024-001 (DMEM+10%FBS)                       │

│   Оператор: Иванов И.                                     │

│                                                            │

│ ● 15.01.2024 - Пассаж P0 → P1                             │

│   Процесс: EXEC-2024-120                                  │

│   Концентрация: 5.2M cells/ml                             │

│   Жизнеспособность: 96%                                   │

│   Оборудование: LAM-02, INC-01                            │

│   Среда: MED-2024-002                                     │

│                                                            │

│ ● 20.01.2024 - Пассаж P1 → P2                             │

│   ...                                                     │

│                                                            │

│ ● 17.02.2024 - ⚠️ ОТКЛОНЕНИЕ DEV-2024-088                 │

│   Тип: CCA fail                                           │

│   Контейнер: T75-042-P3-2                                 │

│   Проблема: Жизнеспособность 75% (норма ≥80%)            │

│   Решение QP: Продолжить (17.02.2024 16:00, Петров А.)   │

│   Комментарий: "На границе нормы, усиленное наблюдение"  │

│                                                            │

│ ● 22.02.2024 - Банкирование MCB                           │

│   Криовиал: 20 шт (CRYO-042-MCB-1...20)                  │

│   Морозильник: FREEZER-80C, Rack 5                        │

│   QC тест (post-thaw): ✅ Жизнеспособность 92%            │

│   QP утверждение: ✅ 25.02.2024 (Петров А.)               │

│                                                            │

│ ● 01.03.2024 - Размораживание WCB                         │

│   ...                                                     │

│                                                            │

│ ● 15.03.2024 - Выдача REL-2024-015                        │

│   Заказ: ORD-2024-010                                     │

│   Контейнеры: 10 криовиал (CRYO-042-WCB-15...24)         │

│   QP утверждение: ✅ 15.03.2024 10:00 (Петров А.)         │

│   Сертификат: [Скачать PDF]                               │

│   Получатель: Клиника "Здоровье", д-р Смирнов В.          │

│                                                            │

└────────────────────────────────────────────────────────────┘

**FR-TRACE-002: Прослеживаемость среды (от компонентов до использования)**

**Описание**: Для любой партии комбинированной среды можно просмотреть:

Какие компоненты использованы (LOT numbers, сроки годности)

Кто и когда приготовил

В каких культурах/процессах использована

Результаты QC тестов

**UI:** Карточка партии среды → вкладка "Прослеживаемость"

**Логика****:**

# GET /api/v1/media/batches/combined/{batch_id}/traceability

def get_media_traceability(batch_id):

    media_batch = CombinedMediaBatch.get(batch_id)

    # Компоненты

    components = []

    for comp in media_batch.components:

        components.append({

            "component_name": comp.media_component_batch.component_name,

            "batch_code": comp.media_component_batch.batch_code,

            "lot_number": comp.media_component_batch.lot_number,

            "supplier": comp.media_component_batch.inventory_item.supplier,

            "expiry_date": comp.media_component_batch.expiry_date,

            "quantity_used": comp.quantity_used,

            "unit": comp.unit

        })

    # Использование в процессах

    usage = ExecutedStep.filter(

        media_batch_used_id=batch_id

    ).join(ExecutedProcess).join(Culture).all()

    usage_summary = []

    for step in usage:

        usage_summary.append({

            "date": step.completed_at,

            "culture": step.executed_process.culture.culture_code,

            "process": step.executed_process.process_code,

            "step_name": step.process_template_step.step_name,

            "operator": step.executed_by_user.full_name

        })

    return {

        "batch_code": media_batch.batch_code,

        "recipe_name": media_batch.media_recipe.recipe_name,

        "prepared_date": media_batch.preparation_date,

        "prepared_by": media_batch.prepared_by_user.full_name,

        "expiry_date": media_batch.expiry_date,

        "status": media_batch.status,

        "sterility_status": media_batch.sterility_status,

        "components": components,

        "usage": usage_summary

    }

**UI ****отображение****:**

┌────────────────────────────────────────────────────────────┐

│ ПРОСЛЕЖИВАЕМОСТЬ СРЕДЫ MED-2024-050                        │

├────────────────────────────────────────────────────────────┤

│                                                            │

│ Рецепт: DMEM с 10% FBS                                     │

│ Дата приготовления: 05.03.2024                            │

│ Приготовил: Сидорова М. (Operator)                        │

│ Срок годности: 01.04.2024                                 │

│ Статус: Активна                                           │

│ Стерильность: ✅ Пройдена (12.03.2024)                    │

│                                                            │

│ ──────────────────────────────────────────────────────────│

│                                                            │

│ КОМПОНЕНТЫ                                                 │

│                                                            │

│ 1. DMEM (Base Medium)                                      │

│    Партия: DMEM-2024-012                                  │

│    LOT: ABC123                                            │

│    Поставщик: Gibco                                       │

│    Срок годности: 01.06.2024                              │

│    Использовано: 900 ml                                   │

│                                                            │

│ 2. FBS (Serum)                                             │

│    Партия: FBS-2024-008                                   │

│    LOT: FBS456                                            │

│    Поставщик: Sigma-Aldrich                               │

│    Срок годности: 01.04.2024 ⚠️ (определяет срок среды)  │

│    Использовано: 100 ml                                   │

│                                                            │

│ 3. Penicillin/Streptomycin (Antibiotic)                   │

│    Партия: PEN-2024-005                                   │

│    LOT: PS789                                             │

│    Поставщик: Gibco                                       │

│    Срок годности: 01.05.2024                              │

│    Использовано: 10 ml                                    │

│                                                            │

│ ──────────────────────────────────────────────────────────│

│                                                            │

│ ИСПОЛЬЗОВАНИЕ (5 процессов)                                │

│                                                            │

│ 1. 07.03.2024 - Культура BMCP-C-2024-042                  │

│    Процесс: EXEC-2024-150 (Пассаж P3→P4)                 │

│    Шаг: Посев в новые контейнеры                          │

│    Оператор: Иванов И.                                    │

│                                                            │

│ 2. 08.03.2024 - Культура BMCP-C-2024-043                  │

│    Процесс: EXEC-2024-155 (Подкормка)                    │

│    Шаг: Замена среды                                      │

│    Оператор: Сидорова М.                                  │

│                                                            │

│ 3. 10.03.2024 - Культура BMCP-C-2024-042                  │

│    ...                                                    │

│                                                            │

│ [Показать все →]                                           │

│                                                            │

└────────────────────────────────────────────────────────────┘

**5.6 Модуль: Задачи (****Tasks****)**

**FR-TASK-001: Автоматическое создание задач**

**Описание**: Система автоматически создаёт задачи для операторов, QC, QP в следующих случаях:

После создания MCB → задача для QC: "Post-thaw тест"

После приготовления среды → задача для QC: "Тест стерильности среды"

После QP решения "Продолжить" (при CCA fail) → задача для оператора: "Повторная проверка через 48 часов"

После QP решения "Карантин" → задача для оператора: "Переместить контейнер в карантинную зону"

После контаминации среды → задача для QC: "Расследование источника контаминации"

**Модель**** ****БД****:**

class Task(Base):

    task_code = String(unique=True)  # TASK-YYYY-NNN

    task_type = Enum('qc_check', 'move_to_quarantine', 'dispose_container', 'investigation', 'other')

    priority = Enum('low', 'medium', 'high', 'critical')

    title = String

    description = Text

    assigned_to_user_id = ForeignKey('User', nullable=True)

    assigned_to_role = Enum('operator', 'qc', 'qp', nullable=True)

    culture_id = ForeignKey('Culture', nullable=True)

    related_entity_type = String(nullable=True)  # 'Container', 'CombinedMediaBatch', 'Deviation'...

    related_entity_id = Integer(nullable=True)

    due_date = DateTime

    status = Enum('pending', 'in_progress', 'completed', 'cancelled')

    created_at = DateTime

    completed_at = DateTime(nullable=True)

**UI:** "Задачи" → список задач с фильтрами (по статусу, приоритету, типу)

**FR-TASK-002: Выполнение задачи**

**Описание**: Пользователь открывает задачу, выполняет действия, отмечает как завершённую.

**UI:**

┌────────────────────────────────────────────────────────────┐

│ ← Назад к задачам                                          │

│                                                            │

│ ЗАДАЧА TASK-2024-042                                       │

│ Статус: В ожидании ⏳  | Приоритет: Высокий 🔴            │

├────────────────────────────────────────────────────────────┤

│                                                            │

│ Тип: Расследование                                         │

│ Дедлайн: 24.02.2024 23:59                                 │

│ Назначено: QC (любой)                                     │

│                                                            │

│ Описание:                                                  │

│ Определить источник контаминации культуры BMCP-C-2024-042 │

│                                                            │

│ Действия:                                                  │

│ 1. Проверить стерильность готовой среды MED-2024-050      │

│ 2. Если готовая среда чистая → проверить компоненты       │

│ 3. Проверить логи приготовления среды                     │

│ 4. Принять решение по компонентам                         │

│                                                            │

│ ──────────────────────────────────────────────────────────│

│                                                            │

│ СВЯЗАННЫЕ СУЩНОСТИ                                         │

│ Культура: BMCP-C-2024-042 [Открыть]                       │

│ Среда: MED-2024-050 [Открыть]                             │

│                                                            │

│ ──────────────────────────────────────────────────────────│

│                                                            │

│ Комментарии:                                               │

│ ┌────────────────────────────────────────────────────────┐│

│ │ Результаты расследования:                              ││

│ │ - Тест стерильности готовой среды: КОНТАМИНИРОВАНА    ││

│ │ - Тесты компонентов: DMEM - чист, FBS - КОНТАМИНИРОВАН││

│ │ Вывод: Виновата сыворотка FBS-2024-008 (LOT FBS456)   ││

│ └────────────────────────────────────────────────────────┘│

│                                                            │

│ [Отметить как завершённую]                                 │

│                                                            │

└────────────────────────────────────────────────────────────┘

**5.7 Модуль: Отчёты и аналитика**

**FR-REPORT-001: ****Производственный**** ****отчёт**** (Production Report)**

**Описание**: Сводный отчёт по производству за период (количество культур, пассажей, банкирований, выдач).

**Параметры:**

Период (с даты по дату)

Тип клеток (фильтр, опционально)

**Выход:**

PDF/Excel отчёт

**Содержание:**

Всего культур создано: X

Всего пассажей выполнено: Y

Всего MCB/WCB создано: Z

Всего выдач: N

Средняя жизнеспособность: 92.5%

Отклонения: K (из них критических: M)

Графики: 

Количество культур по типам клеток

Количество пассажей по неделям

Распределение отклонений по типам

**UI:** "Отчёты" → "Производственный отчёт" → Выбор параметров → "Сгенерировать"

**FR-REPORT-002: ****Отчёт**** ****по**** ****отклонениям**** (Deviation Report)**

**Описание**: Детальный отчёт по всем отклонениям за период.

**Параметры:**

Период

Тип отклонения (фильтр)

Серьёзность (фильтр)

**Выход:**

PDF/Excel отчёт

**Содержание:**

Список всех отклонений (ID, дата, тип, серьёзность, культура, решение QP)

Статистика: 

Всего отклонений: X

Критических: Y

Среднее время разрешения: Z часов

Root Cause Analysis (агрегация по причинам)

Corrective Actions (список предпринятых мер)

**FR-REPORT-003: Дашборд в реальном времени**

**Описание**: Главная страница системы отображает ключевые метрики в реальном времени.

**Метрики:**

Активные культуры: X

Заказы в производстве: Y

Задачи на сегодня: Z (из них просроченных: N)

Отклонения открытые: K

Среды с близким сроком годности (<7 дней): M

**Графики:**

Количество культур по статусам (пирог)

Количество пассажей по неделям (линейный график)

Загрузка инкубаторов (процент занятости)

**UI:** "Главная" (Dashboard)

**6. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ**

**6.1 Производительность**

**NFR-PERF-001: Время отклика UI**

Базовые операции (навигация, открытие карточек): < 1 секунда

Сложные запросы (отчёты, поиск): < 3 секунды

Операции с большими данными (экспорт Excel, PDF): < 10 секунд

**NFR-PERF-002: Пропускная способность API**

Backend должен обрабатывать минимум 100 запросов/секунду

База данных должна поддерживать минимум 500 одновременных подключений

**NFR-PERF-003: Размер базы данных**

Система должна поддерживать работу с 10,000+ культур без деградации производительности

Audit log: ротация старых записей (>2 года) в архив

**Методы оптимизации:**

Индексы БД на часто запрашиваемые поля (culture_code, container_code, timestamps)

Кеширование (Redis): списки picklists, справочники, активные культуры

Пагинация: списки по 20-50 элементов на страницу

Lazy loading: данные загружаются по мере необходимости (например, история культуры загружается только при открытии вкладки "История")

**6.2 Безопасность**

**NFR-SEC-001: Аутентификация**

JWT токены для REST API (access token: 1 час, refresh token: 7 дней)

Двухфакторная аутентификация (2FA) для QP и Admin (опционально)

Блокировка аккаунта после 5 неудачных попыток входа (на 15 минут)

**NFR-SEC-002: Авторизация (RBAC)**

Роли: Admin, QP, QC, Operator, Viewer

Матрица прав (см. раздел 10)

Запрет на удаление данных для всех ролей (только пометка deleted = true)

**NFR-SEC-003: Шифрование**

Пароли: bcrypt (cost factor 12)

Медицинская история донора: AES-256 (ключ хранится в HSM или AWS KMS)

HTTPS (TLS 1.3) для всех подключений

**NFR-SEC-004: ****Audit**** ****Log**

Все действия (создание, обновление, удаление, approve, печать) записываются в Audit Log

Невозможность изменить/удалить записи Audit Log (append-only таблица)

Регулярные бэкапы Audit Log (ежедневно)

**NFR-SEC-005: Защита от атак**

Rate limiting: 100 запросов/минуту на IP

CSRF токены для изменяющих запросов (POST, PUT, DELETE)

SQL Injection prevention: использование ORM (SQLAlchemy) с параметризованными запросами

XSS prevention: экранирование всех пользовательских данных в UI

**6.3 Доступность (****Availability****)**

**NFR-AVAIL-001: ****Uptime**

SLA: 99.5% (максимальное время недоступности: ~43 часа/год или ~3.6 часа/месяц)

Плановое обслуживание: по субботам 02:00-04:00 (уведомление за 7 дней)

**NFR-AVAIL-002: Резервное копирование**

База данных: 

Полный бэкап: ежедневно в 03:00 (хранение 30 дней)

Инкрементный бэкап: каждые 6 часов (хранение 7 дней)

Файлы (документы, сертификаты): 

Ежедневный бэкап (хранение 90 дней)

Время восстановления из бэкапа (RTO): < 4 часа

**NFR-AVAIL-003: ****Disaster**** Recovery**

Репликация БД на резервный сервер (async, задержка < 5 минут)

Failover: автоматическое переключение на резервный сервер при отказе основного (время < 10 минут)

**6.4 Масштабируемость (****Scalability****)**

**NFR-SCALE-001: Горизонтальное масштабирование**

Backend (FastAPI): stateless, можно запускать несколько экземпляров за load balancer

База данных PostgreSQL: поддержка read replicas для чтения (write — на master)

**NFR-SCALE-002: Рост данных**

Система должна поддерживать рост до 100,000+ культур

Архивирование старых данных (культуры в статусе disposed старше 2 лет) в отдельную БД

**6.5 Совместимость (****Compatibility****)**

**NFR-COMPAT-001: Браузеры**

Chrome/Edge: последние 2 версии

Firefox: последние 2 версии

Safari: последние 2 версии

**НЕ поддерживается:** Internet Explorer

**NFR-COMPAT-002: Устройства**

Desktop: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)

Tablet: iPad (iOS 14+), Android планшеты (Android 10+)

Mobile: iOS 14+, Android 10+ (для сканирования QR-кодов)

**NFR-COMPAT-003: Принтеры**

Принтеры этикеток: Zebra (ZPL), DYMO LabelWriter (PDF)

Обычные принтеры: PDF печать (для сертификатов, отчётов)

**6.6 Удобство использования (****Usability****)**

**NFR-USAB-001****: Минимум**** кликов**

Пассирование культуры: Главная → Культуры → Карточка → [Пассировать] (3 клика)

Быстрое сканирование: Кнопка "Сканировать" на главной → сканирование ШК → карточка культуры (1 клик)

**NFR-USAB-002: Прогрессивное раскрытие**

Сначала показывать базовые поля, дополнительные — по клику "Развернуть"

Например, состав комбинированной среды: по умолчанию скрыт, раскрывается по клику

**NFR-USAB-003: Подсказки и автозаполнение**

Все обязательные поля помечены *

Подсказки (tooltips) при наведении на иконку ⓘ

Автозаполнение для полей с picklists (autocomplete)

FEFO-подсказки: первая партия помечена иконкой ⭐

**NFR-USAB-004: Валидация в реальном времени**

Поля валидируются при потере фокуса (blur)

Ошибки показываются красным текстом под полем

Кнопка "Сохранить" неактивна, пока есть ошибки

**NFR-USAB-005: ****Empty**** ****states**

Если таблица пустая: показать сообщение + кнопку действия

Пример: "У вас пока нет культур. [+ Создать первую культуру]"

**NFR-USAB-006: ****Loading**** ****states**

При загрузке данных: скелетоны (skeleton loaders) или спиннеры

При долгих операциях (>3 сек): progress bar

**NFR-USAB-007: ****Error**** ****states**

Понятные сообщения об ошибках (на русском)

Действия: "Повторить", "Сообщить об ошибке", "Вернуться"

**NFR-USAB-008: Массовые операции**

Режим "Применить ко всем" для шагов с несколькими контейнерами

Возможность переопределить значение для конкретного контейнера

**6.7 Доступность (****Accessibility****)**

**NFR-ACCESS-001: Навигация клавиатурой**

Все интерактивные элементы доступны через Tab, Enter, Escape, стрелки

**NFR-ACCESS-002: ARIA-метки**

Все интерактивные элементы имеют aria-label или aria-labelledby

**NFR-ACCESS-003: Контраст**

Минимальный контраст 4.5:1 (WCAG AA) для текста

**NFR-ACCESS-004: Масштабирование**

Поддержка увеличения шрифта до 200% без потери функциональности

**NFR-ACCESS-005: ****Screen**** ****readers**

Корректная озвучивание элементов (тестирование с NVDA/JAWS)

**6.8 Адаптивность (****Responsive****)**

**Разрешения:**

Desktop: 1920x1080 (оптимально), минимум 1366x768

Tablet: 768x1024 (iPad), ориентация: portrait и landscape

Mobile: 375x667 (iPhone SE) и выше (для быстрого сканирования)

**Поведение:**

Sidebar сворачивается на планшетах (показываются только иконки)

Таблицы на мобильных: горизонтальный скролл или карточки

Формы на мобильных: вертикальное расположение полей

**7. ТЕХНИЧЕСКИЙ СТЕК**

**7.1 ****Backend**

**Язык:** Python 3.11+

**Фреймворк:** FastAPI 0.104+

Асинхронный (async/await)

Автогенерация OpenAPI (Swagger/Redoc)

Поддержка WebSocket (для realtime уведомлений)

**База данных:** PostgreSQL 15+

Расширения: pgcrypto (для шифрования), pg_trgm (для полнотекстового поиска)

**ORM:** SQLAlchemy 2.0 (async mode) + Alembic (миграции)

**Валидация****:** Pydantic v2

**Аутентификация****:** PyJWT + passlib (bcrypt)

**Очереди задач:** Celery + Redis

Для асинхронных задач (уведомления QP, генерация отчётов, архивирование)

**Кеширование:** Redis 7+

TTL для справочников: 1 час

TTL для активных культур: 5 минут

**Telegram**** ****Bot****:** aiogram 3.x

Inline keyboards для QP решений

FSM (Finite State Machine) для диалогов

**Генерация**** QR-****кодов****:** qrcode + Pillow

**Генерация**** PDF:** ReportLab (сертификаты, отчёты)

**Печать этикеток:**

Zebra: zpl library (генерация ZPL команд)

DYMO: Python-DYMO (PDF)

**Тестирование:**

pytest + pytest-asyncio (unit tests)

httpx (integration tests для API)

Faker (генерация тестовых данных)

**ПРОДОЛЖЕНИЕ ТЗ (с пункта 7.2)**

**7.2 ****Frontend**** (продолжение)**

**UI библиотека:**

**Вариант 1 (рекомендуемый):** shadcn/ui (компоненты на Radix UI + Tailwind CSS) 

Преимущества: modern, accessible, customizable, tree-shaking

Компоненты: Dialog, DropdownMenu, Select, Toast, Tabs, Command, etc.

**Вариант 2:** Ant Design (antd) 

Преимущества: богатый набор готовых компонентов, Table с сортировкой/фильтрацией

Минусы: больший bundle size

**Рекомендация:** shadcn/ui + Tailwind CSS для гибкости и производительности

**Стилизация:** Tailwind CSS 3.4+

Утилитные классы для быстрой разработки

Кастомизация через tailwind.config.js (цвета, шрифты, breakpoints)

**Формы:**

React Hook Form 7+ (производительность, минимум re-renders)

Zod (schema validation, интеграция с Pydantic backend)

**Таблицы****:** TanStack Table (React Table v8)

Sorting, filtering, pagination

Виртуализация для больших списков (>1000 строк)

**Графики:** Recharts или Chart.js

Для дашборда (пироги, линейные графики, бары)

**Сканирование QR:** html5-qrcode

Использует camera API браузера (getUserMedia)

Работает на мобильных устройствах

**Даты:** date-fns (легковесная альтернатива Moment.js)

Форматирование, парсинг, валидация дат

**Уведомления****:** React Hot Toast (toast notifications)

Для success/error/warning сообщений

**i18n (интернационализация):** react-i18next (если планируется многоязычность)

Основной язык: русский

Опционально: английский (для международных лабораторий)

**Иконки:** Lucide React (набор иконок, форк Feather Icons)

**Тестирование:**

Vitest (unit tests для компонентов)

React Testing Library (интеграционные тесты)

Playwright или Cypress (E2E тесты)

**Линтеры/****форматтеры****:**

ESLint (с правилами TypeScript, React Hooks)

Prettier (форматирование кода)

**Bundler****:** Vite (быстрая сборка, HMR)

**7.3 Инфраструктура и развертывание**

**Контейнеризация:** Docker + Docker Compose

Образы: 

backend: FastAPI app (Python 3.11-alpine)

frontend: Nginx serving static React build

postgres: PostgreSQL 15

redis: Redis 7

celery-worker: Celery worker

celery-beat: Celery scheduler (для периодических задач)

telegram-bot: aiogram bot (отдельный контейнер)

**Оркестрация**** (****production****):** Kubernetes (опционально, для больших инсталляций) или Docker Swarm

**Облачный провайдер (варианты):**

**AWS:** 

ECS/EKS (контейнеры)

RDS PostgreSQL (управляемая БД)

ElastiCache Redis (управляемый Redis)

S3 (хранение файлов: документы, сертификаты)

CloudWatch (мониторинг, логи)

**Yandex ****Cloud****:** 

Compute Cloud (VM для Docker Compose)

Managed PostgreSQL

Managed Redis

Object Storage (аналог S3)

Monitoring (метрики, логи)

**On-****premise****:** 

Собственные серверы (если требования GMP/GDPR запрещают облако)

Proxmox или VMware для виртуализации

**Рекомендация****:** Начать с Docker Compose на 1-2 VM (cost-effective), масштабировать на Kubernetes при росте нагрузки

**Reverse Proxy / Load Balancer:** Nginx или Traefik

SSL/TLS терминация (Let's Encrypt для staging, коммерческий сертификат для production)

Кеширование статики (React build)

Rate limiting

WebSocket support (для realtime уведомлений)

**CI/CD:** GitHub Actions или GitLab CI

Pipeline stages: 

**Lint & Test:** ESLint, Pytest, unit tests

**Build:** Docker images (backend, frontend)

**Push:** Docker Registry (GitHub Packages, AWS ECR, или private registry)

**Deploy****:** 

Staging: автоматически при merge в develop

Production: вручную (approval) при merge в main

**Smoke ****tests****:** Автоматические E2E тесты после деплоя

**Мониторинг:**

**Метрики:** Prometheus + Grafana 

Backend метрики: request rate, error rate, latency (percentiles)

БД метрики: connections, query duration, deadlocks

Celery метрики: queue length, task duration, failures

**Логи****:** ELK Stack (Elasticsearch, Logstash, Kibana) или Loki + Grafana 

Structured logging (JSON format)

Log levels: DEBUG (dev), INFO (staging), WARNING+ (production)

**Алерты****:** Prometheus Alertmanager 

Уведомления в Telegram канал для DevOps

Критичные алерты: 500 errors > 5/min, DB down, Celery queue > 1000 tasks

**Бэкапы:**

PostgreSQL: pg_dump через cron (ежедневно 03:00 UTC) 

Хранение: S3/Object Storage (30 дней полный, 90 дней инкрементный)

Шифрование: AES-256

Файлы (S3/Object Storage): versioning enabled (автоматические снапшоты)

Проверка восстановления: ежемесячно (автоматический скрипт восстанавливает последний бэкап в test-среду)

**Безопасность инфраструктуры:**

Firewall: только порты 80 (HTTP), 443 (HTTPS), 22 (SSH с whitelist IP)

VPN: для доступа к БД и internal services

Secrets management: AWS Secrets Manager, HashiCorp Vault, или Kubernetes Secrets

Регулярные обновления: security patches раз в месяц

**8. АРХИТЕКТУРА СИСТЕМЫ**

**8.1 Общая схема (High-Level Architecture)**

┌─────────────────────────────────────────────────────────────────┐

│                         USERS                                   │

│  [Operator] [QC] [QP] [Admin] [Viewer] [Telegram Bot]          │

└──────────────┬──────────────────────────────────────────────────┘

               │

               │ HTTPS (REST API / WebSocket)

               │

┌──────────────▼──────────────────────────────────────────────────┐

│                    LOAD BALANCER (Nginx/Traefik)                │

│  - SSL Termination                                              │

│  - Rate Limiting                                                │

│  - Static files caching                                         │

└──────────────┬──────────────────────────────────────────────────┘

               │

       ┌───────┴─────────┐

       │                 │

       ▼                 ▼

┌─────────────┐   ┌─────────────────────────────────────────────┐

│  FRONTEND   │   │          BACKEND (FastAPI)                  │

│  (React)    │   │  ┌─────────────────────────────────────────┐│

│             │   │  │  API Layer (REST endpoints)             ││

│  - UI       │   │  │  - Auth (JWT)                           ││

│  - State    │   │  │  - CRUD operations                      ││

│  - QR scan  │   │  │  - Business logic                       ││

└─────────────┘   │  └─────────────────────────────────────────┘│

                  │  ┌─────────────────────────────────────────┐│

                  │  │  Service Layer                          ││

                  │  │  - CultureService                       ││

                  │  │  - ProcessService                       ││

                  │  │  - DeviationService                     ││

                  │  │  - MediaService                         ││

                  │  │  - CCAService (критич. критерии)        ││

                  │  └─────────────────────────────────────────┘│

                  │  ┌─────────────────────────────────────────┐│

                  │  │  Data Access Layer (SQLAlchemy ORM)     ││

                  │  │  - Models                               ││

                  │  │  - Repositories                         ││

                  │  └─────────────────────────────────────────┘│

                  └─────────────┬───────────────────────────────┘

                                │

                    ┌───────────┼───────────┐

                    │           │           │

                    ▼           ▼           ▼

              ┌──────────┐ ┌────────┐ ┌────────────────┐

              │PostgreSQL│ │ Redis  │ │ Celery Workers │

              │  (БД)    │ │(Cache) │ │  - Async tasks │

              │          │ │        │ │  - Notifications│

              └──────────┘ └────────┘ └────────────────┘

                    │                        │

                    │                        ▼

                    │                  ┌───────────────┐

                    │                  │Telegram Bot   │

                    │                  │(aiogram)      │

                    │                  └───────────────┘

                    │

                    ▼

              ┌──────────────────────┐

              │ External Services    │

              │ - Label Printer      │

              │ - Email (SMTP)       │

              └──────────────────────┘

**8.2 ****Слои**** ****приложения**** (Backend)**

**8.2.1 API Layer (****FastAPI**** Routes)**

**Ответственность****:**

Приём HTTP запросов

Валидация входных данных (Pydantic models)

Аутентификация/авторизация (JWT, RBAC)

Вызов методов Service Layer

Формирование HTTP ответов

Обработка ошибок (HTTPException)

**Структура файлов:**

backend/app/api/

├── v1/

│   ├── __init__.py

│   ├── auth.py           # POST /login, /refresh, /logout

│   ├── cultures.py       # CRUD /cultures

│   ├── containers.py     # CRUD /containers

│   ├── donations.py      # CRUD /donations

│   ├── processes.py      # Выполнение процессов /processes/execute

│   ├── deviations.py     # CRUD /deviations, QP decisions

│   ├── media.py          # Комбинированные среды

│   ├── inventory.py      # Инвентарь

│   ├── equipment.py      # Оборудование

│   ├── qc_tests.py       # QC тесты

│   ├── orders.py         # Заказы

│   ├── releases.py       # Выдачи

│   ├── reports.py        # Генерация отчётов

│   └── users.py          # Управление пользователями (Admin)

└── deps.py               # Dependencies (get_current_user, get_db)

**Пример**** (****):**

from fastapi import APIRouter, Depends, HTTPException

from app.services.culture_service import CultureService

from app.api.deps import get_current_user, get_db

from app.schemas.culture import CultureCreate, CultureResponse

router = APIRouter(prefix="/cultures", tags=["cultures"])

@router.post("/", response_model=CultureResponse)

async def create_culture(

    culture_in: CultureCreate,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(get_current_user)

):

    # RBAC check

    if current_user.role not in ['operator', 'admin']:

        raise HTTPException(403, "Insufficient permissions")

    # Business logic delegation

    service = CultureService(db)

    culture = await service.create_culture(culture_in, current_user.id)

    return culture

**8.2.2 Service Layer (Business Logic)**

**Ответственность:**

Бизнес-логика (валидация, расчёты, CCA проверки)

Оркестрация операций (транзакции между несколькими сущностями)

Вызов методов Repository Layer

Создание асинхронных задач (Celery)

Генерация кодов (culture_code, deviation_code, etc.)

Логирование бизнес-событий

**Структура файлов:**

backend/app/services/

├── __init__.py

├── culture_service.py

├── process_service.py

├── deviation_service.py

├── media_service.py

├── cca_service.py           # Проверка критических критериев

├── inventory_service.py

├── qc_service.py

├── notification_service.py  # Уведомления (Telegram, Email)

├── barcode_service.py       # Генерация QR/штрих-кодов

└── audit_service.py         # Audit logging

**Пример**** (culture_service.py):**

from app.repositories.culture_repository import CultureRepository

from app.repositories.container_repository import ContainerRepository

from app.services.barcode_service import BarcodeService

from app.services.audit_service import AuditService

from app.tasks.notifications import notify_team_new_culture

class CultureService:

    def __init__(self, db: AsyncSession):

        self.db = db

        self.culture_repo = CultureRepository(db)

        self.container_repo = ContainerRepository(db)

        self.barcode_service = BarcodeService()

        self.audit_service = AuditService(db)

    async def create_culture(self, culture_in: CultureCreate, user_id: int) -> Culture:

        # Генерация кода

        culture_code = await self._generate_culture_code()

        # Создание культуры

        culture = await self.culture_repo.create({

            **culture_in.dict(),

            "culture_code": culture_code,

            "current_passage": 0,

            "status": "active",

            "risk_flag": "none"

        })

        # Audit log

        await self.audit_service.log(

            user_id=user_id,

            action_type="create",

            entity_type="Culture",

            entity_id=culture.id,

            comment=f"Created culture {culture_code}"

        )

        # Асинхронное уведомление команды (Celery)

        notify_team_new_culture.delay(culture.id)

        return culture

    async def _generate_culture_code(self) -> str:

        # BMCP-C-YYYY-NNN

        year = datetime.now().year

        last_culture = await self.culture_repo.get_last_by_year(year)

        next_number = 1 if not last_culture else int(last_culture.culture_code.split('-')[-1]) + 1

        return f"BMCP-C-{year}-{next_number:03d}"

**8.2.3 Repository Layer (Data Access)**

**Ответственность****:**

CRUD операции с БД (через SQLAlchemy ORM)

Сложные запросы (joins, aggregations)

Транзакции БД

**Структура файлов:**

backend/app/repositories/

├── __init__.py

├── base_repository.py      # Базовый класс с общими методами (get, create, update, delete)

├── culture_repository.py

├── container_repository.py

├── donation_repository.py

├── process_repository.py

├── deviation_repository.py

└── ...

**Пример**** (base_repository.py):**

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from typing import Generic, TypeVar, Type, Optional, List

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):

    def __init__(self, model: Type[ModelType], db: AsyncSession):

        self.model = model

        self.db = db

    async def get(self, id: int) -> Optional[ModelType]:

        result = await self.db.execute(select(self.model).where(self.model.id == id))

        return result.scalars().first()

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[ModelType]:

        result = await self.db.execute(select(self.model).offset(skip).limit(limit))

        return result.scalars().all()

    async def create(self, obj_in: dict) -> ModelType:

        db_obj = self.model(**obj_in)

        self.db.add(db_obj)

        await self.db.commit()

        await self.db.refresh(db_obj)

        return db_obj

    async def update(self, id: int, obj_in: dict) -> Optional[ModelType]:

        db_obj = await self.get(id)

        if not db_obj:

            return None

        for key, value in obj_in.items():

            setattr(db_obj, key, value)

        await self.db.commit()

        await self.db.refresh(db_obj)

        return db_obj

    async def delete(self, id: int) -> bool:

        db_obj = await self.get(id)

        if not db_obj:

            return False

        await self.db.delete(db_obj)

        await self.db.commit()

        return True

**Пример**** (culture_repository.py):**

from app.repositories.base_repository import BaseRepository

from app.models.culture import Culture

class CultureRepository(BaseRepository[Culture]):

    def __init__(self, db: AsyncSession):

        super().__init__(Culture, db)

    async def get_by_code(self, culture_code: str) -> Optional[Culture]:

        result = await self.db.execute(

            select(Culture).where(Culture.culture_code == culture_code)

        )

        return result.scalars().first()

    async def get_last_by_year(self, year: int) -> Optional[Culture]:

        result = await self.db.execute(

            select(Culture)

            .where(Culture.culture_code.like(f"BMCP-C-{year}-%"))

            .order_by(Culture.created_at.desc())

            .limit(1)

        )

        return result.scalars().first()

    async def get_cultures_with_risk(self) -> List[Culture]:

        result = await self.db.execute(

            select(Culture).where(Culture.risk_flag.in_(['at_risk', 'critical']))

        )

        return result.scalars().all()

**8.3 ****Модель**** ****данных**** (Database Schema)**

**8.3.1 ER-****диаграмма**** (****упрощённая****)**

┌──────────────┐         ┌──────────────┐         ┌──────────────┐

│    Donor     │ 1     N │   Donation   │ 1     N │   Culture    │

│--------------│◄────────┤--------------│◄────────┤--------------│

│ donor_code   │         │ donation_code│         │ culture_code │

│ birth_year   │         │ donation_date│         │ cell_type    │

│ sex          │         │ tissue_type  │         │ status       │

└──────────────┘         │ qp_verified  │         │ risk_flag    │

                         └──────────────┘         └──────┬───────┘

                                                         │ 1

                                                         │

                                                         │ N

                                                  ┌──────▼───────┐

                                                  │  Container   │

                                                  │--------------│

                                                  │ container_code│

                                                  │ passage_num  │

                                                  │ status       │

                                                  └──────────────┘

┌──────────────┐         ┌──────────────────┐         ┌──────────────┐

│ProcessTemplate│ 1    N │ExecutedProcess   │ 1     N │ExecutedStep  │

│--------------│◄────────┤------------------│◄────────┤--------------│

│ template_code│         │ process_code     │         │ step_number  │

│ name         │         │ culture_id (FK)  │         │ recorded_data│

└──────────────┘         │ status           │         │ cca_passed   │

                         └──────────────────┘         │ scanned_equip│

                                                       └──────────────┘

┌──────────────┐         ┌──────────────────┐

│  Deviation   │ N     1 │   Culture        │

│--------------│────────►│ (выше)           │

│ deviation_code│         └──────────────────┘

│ type         │

│ severity     │         ┌──────────────────┐

│ qp_decision  │ N     1 │   User (QP)      │

└──────┬───────┘────────►│------------------│

       │                 │ username         │

       │                 │ role             │

       │                 └──────────────────┘

       │

       │ 1

       │

       │ 1

┌──────▼───────────┐

│TelegramNotif     │

│------------------│

│ deviation_id (FK)│

│ sent_at          │

│ qp_user_id (FK)  │

└──────────────────┘

┌──────────────┐         ┌────────────────────┐         ┌──────────────┐

│MediaRecipe   │ 1     N │CombinedMediaBatch  │ N     N │MediaComponent│

│--------------│◄────────┤--------------------│◄────────┤Batch         │

│ recipe_code  │         │ batch_code         │         │--------------│

│ name         │         │ preparation_date   │         │ batch_code   │

└──────────────┘         │ expiry_date        │         │ lot_number   │

                         │ status             │         │ expiry_date  │

                         └────────────────────┘         └──────────────┘

**8.3.2 ****Ключевые**** ****таблицы**** (PostgreSQL DDL, ****упрощённо****)**

-- Donors

CREATE TABLE donors (

    id SERIAL PRIMARY KEY,

    donor_code VARCHAR(50) UNIQUE NOT NULL,

    birth_year INTEGER,

    sex VARCHAR(10),

    blood_type VARCHAR(10),

    consent_form_url TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Donations

CREATE TABLE donations (

    id SERIAL PRIMARY KEY,

    donation_code VARCHAR(50) UNIQUE NOT NULL,

    donor_id INTEGER REFERENCES donors(id),

    donation_date DATE NOT NULL,

    tissue_type VARCHAR(100),

    qp_verified BOOLEAN DEFAULT FALSE,

    qp_verified_by_user_id INTEGER REFERENCES users(id),

    qp_verified_at TIMESTAMP,

    status VARCHAR(20) DEFAULT 'received',

    created_at TIMESTAMP DEFAULT NOW()

);

-- Cultures

CREATE TABLE cultures (

    id SERIAL PRIMARY KEY,

    culture_code VARCHAR(50) UNIQUE NOT NULL,

    donation_id INTEGER REFERENCES donations(id),

    cell_type VARCHAR(100),

    tissue_source VARCHAR(100),

    current_passage INTEGER DEFAULT 0,

    status VARCHAR(20) DEFAULT 'active',

    risk_flag VARCHAR(20) DEFAULT 'none',

    risk_flag_reason TEXT,

    risk_flag_set_at TIMESTAMP,

    risk_flag_cleared_at TIMESTAMP,

    media_batch_used_id INTEGER REFERENCES combined_media_batches(id),

    order_id INTEGER REFERENCES orders(id),

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx_cultures_status ON cultures(status);

CREATE INDEX idx_cultures_risk_flag ON cultures(risk_flag);

CREATE INDEX idx_cultures_donation ON cultures(donation_id);

-- Containers

CREATE TABLE containers (

    id SERIAL PRIMARY KEY,

    container_code VARCHAR(50) UNIQUE NOT NULL,

    culture_id INTEGER REFERENCES cultures(id) ON DELETE CASCADE,

    container_type_id INTEGER REFERENCES container_types(id),

    passage_number INTEGER,

    split_index INTEGER,

    status VARCHAR(20) DEFAULT 'active',

    location_id INTEGER REFERENCES locations(id),

    qr_code_data JSONB,

    volume_ml DECIMAL(10,2),

    cell_concentration BIGINT,

    viability_percent DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT NOW(),

    frozen_at TIMESTAMP,

    thawed_at TIMESTAMP,

    disposed_at TIMESTAMP

);

CREATE INDEX idx_containers_culture ON containers(culture_id);

CREATE INDEX idx_containers_status ON containers(status);

-- Process Templates

CREATE TABLE process_templates (

    id SERIAL PRIMARY KEY,

    template_code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    version VARCHAR(20),

    is_active BOOLEAN DEFAULT TRUE,

    applicable_cell_types JSONB,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Process Template Steps

CREATE TABLE process_template_steps (

    id SERIAL PRIMARY KEY,

    process_template_id INTEGER REFERENCES process_templates(id) ON DELETE CASCADE,

    step_number INTEGER NOT NULL,

    step_name VARCHAR(255),

    step_type VARCHAR(50),

    description TEXT,

    sop_reference VARCHAR(100),

    requires_equipment_scan BOOLEAN DEFAULT FALSE,

    expected_equipment_id INTEGER REFERENCES equipment(id),

    is_critical BOOLEAN DEFAULT FALSE,

    required_parameters JSONB,

    cca_rules JSONB,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Executed Processes

CREATE TABLE executed_processes (

    id SERIAL PRIMARY KEY,

    process_code VARCHAR(50) UNIQUE NOT NULL,

    process_template_id INTEGER REFERENCES process_templates(id),

    culture_id INTEGER REFERENCES cultures(id),

    container_ids JSONB,

    started_by_user_id INTEGER REFERENCES users(id),

    started_at TIMESTAMP NOT NULL,

    completed_at TIMESTAMP,

    status VARCHAR(20) DEFAULT 'in_progress',

    created_at TIMESTAMP DEFAULT NOW()

);

-- Executed Steps

CREATE TABLE executed_steps (

    id SERIAL PRIMARY KEY,

    executed_process_id INTEGER REFERENCES executed_processes(id) ON DELETE CASCADE,

    process_template_step_id INTEGER REFERENCES process_template_steps(id),

    container_id INTEGER REFERENCES containers(id),

    executed_by_user_id INTEGER REFERENCES users(id),

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    status VARCHAR(20) DEFAULT 'pending',

    recorded_parameters JSONB,

    sop_confirmed_at TIMESTAMP,

    scanned_equipment_id INTEGER REFERENCES equipment(id),

    equipment_scan_timestamp TIMESTAMP,

    media_batch_used_id INTEGER REFERENCES combined_media_batches(id),

    cca_passed BOOLEAN,

    cca_results JSONB,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Deviations

CREATE TABLE deviations (

    id SERIAL PRIMARY KEY,

    deviation_code VARCHAR(50) UNIQUE NOT NULL,

    deviation_type VARCHAR(50),

    severity VARCHAR(20),

    culture_id INTEGER REFERENCES cultures(id),

    container_id INTEGER REFERENCES containers(id),

    executed_step_id INTEGER REFERENCES executed_steps(id),

    description TEXT,

    detected_by_user_id INTEGER REFERENCES users(id),

    detected_at TIMESTAMP NOT NULL,

    status VARCHAR(20) DEFAULT 'open',

    qp_review_required BOOLEAN DEFAULT FALSE,

    qp_notified_at TIMESTAMP,

    qp_reviewed_by_user_id INTEGER REFERENCES users(id),

    qp_reviewed_at TIMESTAMP,

    qp_review_decision VARCHAR(20),

    qp_review_comments TEXT,

    root_cause TEXT,

    corrective_action TEXT,

    preventive_action TEXT,

    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx_deviations_status ON deviations(status);

CREATE INDEX idx_deviations_culture ON deviations(culture_id);

-- Media Recipes

CREATE TABLE media_recipes (

    id SERIAL PRIMARY KEY,

    recipe_code VARCHAR(50) UNIQUE NOT NULL,

    recipe_name VARCHAR(255),

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    shelf_life_days INTEGER,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Media Recipe Components

CREATE TABLE media_recipe_components (

    id SERIAL PRIMARY KEY,

    media_recipe_id INTEGER REFERENCES media_recipes(id) ON DELETE CASCADE,

    component_name VARCHAR(255),

    component_type VARCHAR(50),

    quantity_percent DECIMAL(5,2),

    quantity_per_liter DECIMAL(10,2),

    unit VARCHAR(20),

    is_optional BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Media Component Batches (из Inventory)

CREATE TABLE media_component_batches (

    id SERIAL PRIMARY KEY,

    inventory_item_id INTEGER REFERENCES inventory_items(id),

    component_name VARCHAR(255),

    batch_code VARCHAR(50),

    lot_number VARCHAR(100),

    quantity_remaining DECIMAL(10,2),

    unit VARCHAR(20),

    expiry_date DATE,

    status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT NOW()

);

-- Combined Media Batches

CREATE TABLE combined_media_batches (

    id SERIAL PRIMARY KEY,

    batch_code VARCHAR(50) UNIQUE NOT NULL,

    media_recipe_id INTEGER REFERENCES media_recipes(id),

    preparation_date DATE,

    expiry_date DATE,

    volume_ml DECIMAL(10,2),

    volume_remaining_ml DECIMAL(10,2),

    sterility_status VARCHAR(20) DEFAULT 'pending',

    status VARCHAR(20) DEFAULT 'quarantine',

    prepared_by_user_id INTEGER REFERENCES users(id),

    storage_location_id INTEGER REFERENCES locations(id),

    qr_code_data JSONB,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx_combined_media_expiry ON combined_media_batches(expiry_date);

CREATE INDEX idx_combined_media_status ON combined_media_batches(status);

-- Combined Media Batch Components (связь M:N)

CREATE TABLE combined_media_batch_components (

    id SERIAL PRIMARY KEY,

    combined_media_batch_id INTEGER REFERENCES combined_media_batches(id) ON DELETE CASCADE,

    media_component_batch_id INTEGER REFERENCES media_component_batches(id),

    quantity_used DECIMAL(10,2),

    unit VARCHAR(20),

    created_at TIMESTAMP DEFAULT NOW()

);

-- Equipment

CREATE TABLE equipment (

    id SERIAL PRIMARY KEY,

    equipment_code VARCHAR(50) UNIQUE NOT NULL,

    equipment_name VARCHAR(255),

    equipment_type VARCHAR(50),

    serial_number VARCHAR(100),

    manufacturer VARCHAR(100),

    location_id INTEGER REFERENCES locations(id),

    status VARCHAR(20) DEFAULT 'operational',

    last_calibration_date DATE,

    calibration_valid_until DATE,

    calibration_frequency_days INTEGER,

    qr_code_data JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

-- Locations

CREATE TABLE locations (

    id SERIAL PRIMARY KEY,

    location_code VARCHAR(50) UNIQUE NOT NULL,

    location_name VARCHAR(255),

    location_type VARCHAR(50),

    parent_location_id INTEGER REFERENCES locations(id),

    temperature_min DECIMAL(5,2),

    temperature_max DECIMAL(5,2),

    capacity INTEGER,

    current_occupancy INTEGER DEFAULT 0,

    is_clean_room BOOLEAN DEFAULT FALSE,

    status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT NOW()

);

-- Orders

CREATE TABLE orders (

    id SERIAL PRIMARY KEY,

    order_code VARCHAR(50) UNIQUE NOT NULL,

    client_name VARCHAR(255),

    client_contact JSONB,

    cell_type_required VARCHAR(100),

    quantity_required INTEGER,

    delivery_date_target DATE,

    status VARCHAR(20) DEFAULT 'received',

    priority VARCHAR(20) DEFAULT 'standard',

    created_at TIMESTAMP DEFAULT NOW()

);

-- Releases

CREATE TABLE releases (

    id SERIAL PRIMARY KEY,

    release_code VARCHAR(50) UNIQUE NOT NULL,

    order_id INTEGER REFERENCES orders(id),

    culture_id INTEGER REFERENCES cultures(id),

    container_ids JSONB,

    release_date DATE,

    qp_approved_by_user_id INTEGER REFERENCES users(id),

    qp_approved_at TIMESTAMP,

    certificate_of_analysis_url TEXT,

    status VARCHAR(20) DEFAULT 'pending_qp',

    created_at TIMESTAMP DEFAULT NOW()

);

-- QC Tests

CREATE TABLE qc_tests (

    id SERIAL PRIMARY KEY,

    test_code VARCHAR(50) UNIQUE NOT NULL,

    culture_id INTEGER REFERENCES cultures(id),

    container_id INTEGER REFERENCES containers(id),

    test_type VARCHAR(50),

    test_method VARCHAR(255),

    requested_by_user_id INTEGER REFERENCES users(id),

    requested_at TIMESTAMP,

    performed_by_user_id INTEGER REFERENCES users(id),

    performed_at TIMESTAMP,

    result_status VARCHAR(20) DEFAULT 'pending',

    result_value TEXT,

    result_notes TEXT,

    certificate_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Users

CREATE TABLE users (

    id SERIAL PRIMARY KEY,

    username VARCHAR(50) UNIQUE NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    full_name VARCHAR(255),

    role VARCHAR(20) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    password_hash VARCHAR(255),

    last_login_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Telegram Users

CREATE TABLE telegram_users (

    id SERIAL PRIMARY KEY,

    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    telegram_id BIGINT UNIQUE NOT NULL,

    telegram_username VARCHAR(100),

    verified BOOLEAN DEFAULT FALSE,

    verification_code VARCHAR(10),

    verification_sent_at TIMESTAMP,

    notifications_enabled BOOLEAN DEFAULT TRUE,

    notification_preferences JSONB,

    created_at TIMESTAMP DEFAULT NOW()

);

-- Audit Log

CREATE TABLE audit_log (

    id BIGSERIAL PRIMARY KEY,

    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,

    user_id INTEGER REFERENCES users(id),

    action_type VARCHAR(50) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id INTEGER NOT NULL,

    changes JSONB,

    ip_address INET,

    user_agent TEXT,

    comment TEXT

);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- Tasks

CREATE TABLE tasks (

    id SERIAL PRIMARY KEY,

    task_code VARCHAR(50) UNIQUE NOT NULL,

    task_type VARCHAR(50),

    priority VARCHAR(20) DEFAULT 'medium',

    title VARCHAR(255),

    description TEXT,

    assigned_to_user_id INTEGER REFERENCES users(id),

    assigned_to_role VARCHAR(20),

    culture_id INTEGER REFERENCES cultures(id),

    related_entity_type VARCHAR(100),

    related_entity_id INTEGER,

    due_date TIMESTAMP,

    status VARCHAR(20) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT NOW(),

    completed_at TIMESTAMP

);

CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_user_id);

**8.4 ****Celery**** ****Tasks**** (Асинхронные задачи)**

**Структура файлов:**

backend/app/tasks/

├── __init__.py

├── celery_app.py           # Инициализация Celery

├── notifications.py        # Уведомления (Telegram, Email)

├── reports.py              # Генерация отчётов

├── archiving.py            # Архивирование старых данных

└── scheduled.py            # Периодические задачи (Celery Beat)

**Примеры**** ****задач****:**

**:**

from app.tasks.celery_app import celery

from app.telegram.bot import send_message_to_qp

from app.models.deviation import Deviation

@celery.task

def notify_qp_deviation(deviation_id: int):

    """Уведомление QP о новом отклонении (Telegram)"""

    deviation = Deviation.get(deviation_id)

    qp_users = User.filter(role='qp', is_active=True)

    for qp in qp_users:

        telegram_user = TelegramUser.get(user_id=qp.id)

        if telegram_user and telegram_user.notifications_enabled:

            send_message_to_qp(telegram_user.telegram_id, deviation)

@celery.task

def notify_qp_new_donation(donation_id: int):

    """Асинхронное уведомление QP о новой донации (через 4 часа)"""

    import time

    time.sleep(4 * 3600)  # 4 часа

    donation = Donation.get(donation_id)

    if donation.qp_verified:

        return  # Уже проверено

    qp_users = User.filter(role='qp', is_active=True)

    for qp in qp_users:

        # Telegram

        telegram_user = TelegramUser.get(user_id=qp.id)

        if telegram_user:

            send_telegram_message(

                telegram_user.telegram_id,

                f"Новая донация {donation.donation_code} требует проверки документов."

            )

        # Email

        send_email(qp.email, "Проверка донации", f"Донация {donation.donation_code}...")

**:**

@celery.task

def generate_production_report(start_date: str, end_date: str, user_email: str):

    """Генерация производственного отчёта (асинхронно)"""

    from app.services.report_service import ReportService

    service = ReportService()

    pdf_path = service.generate_production_report(start_date, end_date)

    # Отправка на email

    send_email_with_attachment(user_email, "Производственный отчёт", pdf_path)

** (Celery Beat):**

from celery.schedules import crontab

from app.tasks.celery_app import celery

@celery.task

def check_media_expiry():

    """Проверка сред с близким сроком годности (ежедневно 09:00)"""

    from datetime import date, timedelta

    soon_expiring = CombinedMediaBatch.filter(

        status='active',

        expiry_date__lte=date.today() + timedelta(days=7)

    )

    if soon_expiring:

        # Уведомление операторов

        notify_team("Среды с близким сроком годности", soon_expiring)

@celery.task

def check_equipment_calibration():

    """Проверка калибровки оборудования (ежедневно 09:00)"""

    from datetime import date

    overdue = Equipment.filter(

        calibration_valid_until__lte=date.today()

    )

    if overdue:

        # Уведомление Admin

        notify_admin("Оборудование требует калибровки", overdue)

# Регистрация периодических задач

celery.conf.beat_schedule = {

    'check-media-expiry-daily': {

        'task': 'app.tasks.scheduled.check_media_expiry',

        'schedule': crontab(hour=9, minute=0),  # Каждый день в 09:00

    },

    'check-equipment-calibration-daily': {

        'task': 'app.tasks.scheduled.check_equipment_calibration',

        'schedule': crontab(hour=9, minute=0),

    },

}

**8.5 Telegram Bot Architecture (****aiogram****)**

**Структура**** ****файлов****:**

backend/app/telegram/

├── __init__.py

├── bot.py                  # Инициализация бота

├── handlers/

│   ├── __init__.py

│   ├── start.py            # /start, регистрация

│   ├── deviation_handlers.py  # Обработка callback от QP (решения по Deviation)

│   └── common.py           # Общие команды (/help, /status)

├── keyboards/

│   ├── __init__.py

│   └── inline.py           # Inline клавиатуры (кнопки для QP решений)

├── middlewares/

│   └── auth.py             # Проверка прав (только QP могут принимать решения)

└── states.py               # FSM состояния (для диалогов)

**:**

from aiogram import Bot, Dispatcher

from aiogram.fsm.storage.redis import RedisStorage

from app.config import settings

bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

storage = RedisStorage.from_url(settings.REDIS_URL)

dp = Dispatcher(storage=storage)

# Регистрация handlers

from app.telegram.handlers import start, deviation_handlers, common

dp.include_router(start.router)

dp.include_router(deviation_handlers.router)

dp.include_router(common.router)

async def start_bot():

    await bot.delete_webhook(drop_pending_updates=True)

    await dp.start_polling(bot)

**handlers/deviation_handlers.py:**

from aiogram import Router, F

from aiogram.types import CallbackQuery, Message

from aiogram.fsm.context import FSMContext

from app.telegram.states import DeviationReviewStates

router = Router()

@router.callback_query(F.data.startswith("dev_"))

async def handle_deviation_decision(callback: CallbackQuery, state: FSMContext):

    # Парсинг: "dev_123_continue"

    parts = callback.data.split("_")

    deviation_id = int(parts[1])

    decision = parts[2]

    # Запрос комментария

    await callback.message.answer(

        f"Вы выбрали: {decision}\nВведите комментарий:",

        reply_markup=ForceReply()

    )

    # FSM state

    await state.set_state(DeviationReviewStates.waiting_for_comment)

    await state.update_data(deviation_id=deviation_id, decision=decision)

@router.message(DeviationReviewStates.waiting_for_comment)

async def process_comment(message: Message, state: FSMContext):

    data = await state.get_data()

    # API call к backend

    result = await api_client.review_deviation(

        deviation_id=data['deviation_id'],

        decision=data['decision'],

        comment=message.text

    )

    await message.answer(f"✅ Решение сохранено: {result['deviation_code']}")

    await state.clear()

**9. API СПЕЦИФИКАЦИЯ (дополнения)**

**9.1 ****Endpoints****: Equipment (новые)**

**9.1.1 Печать QR-этикетки оборудования**

**POST /****api****/v1/equipment/{****equipment_id****}/print-label**

**Request:**

{

  "printer_type": "zebra",  // "zebra" | "dymo"

  "copies": 1

}

**Response (200 OK):**

{

  "success": true,

  "message": "Label sent to printer",

  "equipment_code": "INC-01",

  "print_job_id": "PRINT-2024-042"

}

**Backend logic:**

@router.post("/equipment/{equipment_id}/print-label")

async def print_equipment_label(

    equipment_id: int,

    request: PrintLabelRequest,

    current_user: User = Depends(get_current_user)

):

    equipment = await equipment_repo.get(equipment_id)

    if not equipment:

        raise HTTPException(404, "Equipment not found")

    # Генерация QR-кода

    qr_data = {

        "equipment_id": equipment.id,

        "equipment_code": equipment.equipment_code,

        "calibration_valid_until": equipment.calibration_valid_until.isoformat()

    }

    equipment.qr_code_data = qr_data

    await equipment_repo.update(equipment)

    # Печать

    barcode_service = BarcodeService()

    print_job_id = await barcode_service.print_equipment_label(

        equipment,

        printer_type=request.printer_type,

        copies=request.copies

    )

    # Audit log

    await audit_service.log(

        user_id=current_user.id,

        action_type="print",

        entity_type="Equipment",

        entity_id=equipment.id,

        comment=f"Label printed ({request.copies} copies)"

    )

    return {

        "success": True,

        "equipment_code": equipment.equipment_code,

        "print_job_id": print_job_id

    }

**9.1.2 ****Валидация**** ****отсканированного**** ****оборудования**

**POST /****api****/v1/equipment/validate-scan**

**Request:**

{

  "qr_code_data": "{\"equipment_id\": 5, \"equipment_code\": \"INC-01\", \"calibration_valid_until\": \"2024-06-15\"}",

  "expected_equipment_id": 5  // опционально, если указано в step template

}

**Response (200 OK - ****валидация**** ****прошла****):**

{

  "valid": true,

  "equipment": {

    "id": 5,

    "equipment_code": "INC-01",

    "equipment_name": "Инкубатор CO2 Thermo Scientific",

    "status": "operational",

    "calibration_valid_until": "2024-06-15"

  }

}

**Response (400 Bad Request - ****валидация**** ****не**** ****прошла****):**

{

  "valid": false,

  "errors": [

    "Истёк срок калибровки (15.02.2024)",

    "Статус оборудования: maintenance (требуется operational)"

  ]

}

**Backend logic:**

@router.post("/equipment/validate-scan")

async def validate_equipment_scan(

    request: ValidateEquipmentScanRequest,

    current_user: User = Depends(get_current_user)

):

    # Парсинг QR

    qr_data = json.loads(request.qr_code_data)

    equipment_id = qr_data['equipment_id']

    equipment = await equipment_repo.get(equipment_id)

    if not equipment:

        return {"valid": False, "errors": ["Оборудование не найдено в системе"]}

    errors = []

    # Проверка: соответствует ожидаемому?

    if request.expected_equipment_id and equipment.id != request.expected_equipment_id:

        expected = await equipment_repo.get(request.expected_equipment_id)

        errors.append(

            f"Отсканировано {equipment.equipment_code}, но требуется {expected.equipment_code}"

        )

    # Проверка: калибровка не просрочена?

    if equipment.calibration_valid_until < date.today():

        errors.append(f"Истёк срок калибровки ({equipment.calibration_valid_until.strftime('%d.%m.%Y')})")

    # Проверка: статус operational?

    if equipment.status != 'operational':

        errors.append(f"Статус оборудования: {equipment.status} (требуется operational)")

    if errors:

        return {"valid": False, "errors": errors}

    return {

        "valid": True,

        "equipment": {

            "id": equipment.id,

            "equipment_code": equipment.equipment_code,

            "equipment_name": equipment.equipment_name,

            "status": equipment.status,

            "calibration_valid_until": equipment.calibration_valid_until

        }

    }

**9.2 ****Endpoints****: Media (дополнения)**

**9.2.1 FEFO валидация при выборе среды**

**POST /****api****/v1/media/batches/combined/validate-****fefo**

**Request:**

{

  "selected_batch_id": 50,

  "media_recipe_id": 1,

  "required_volume_ml": 50.0

}

**Response (200 OK - FEFO ****соблюдён****):**

{

  "fefo_compliant": true,

  "selected_batch": {

    "batch_code": "MED-2024-048",

    "expiry_date": "2024-04-01"

  }

}

**Response (200 OK - FEFO нарушен, есть более ранняя партия):**

{

  "fefo_compliant": false,

  "selected_batch": {

    "batch_code": "MED-2024-050",

    "expiry_date": "2024-04-15"

  },

  "recommended_batch": {

    "batch_code": "MED-2024-048",

    "expiry_date": "2024-04-01",

    "volume_remaining_ml": 800.0

  },

  "warning": "Доступна партия MED-2024-048 с более ранним сроком (2024-04-01). Рекомендуется использовать её."

}

**Backend**** ****logic****:**

@router.post("/media/batches/combined/validate-fefo")

async def validate_fefo(

    request: ValidateFEFORequest,

    current_user: User = Depends(get_current_user)

):

    selected_batch = await media_repo.get_combined_batch(request.selected_batch_id)

    # Поиск партий с более ранним сроком

    earlier_batches = await media_repo.get_combined_batches_fefo(

        media_recipe_id=request.media_recipe_id,

        status='active',

        min_volume=request.required_volume_ml,

        expiry_before=selected_batch.expiry_date

    )

    if not earlier_batches:

        return {

            "fefo_compliant": True,

            "selected_batch": {

                "batch_code": selected_batch.batch_code,

                "expiry_date": selected_batch.expiry_date

            }

        }

    recommended = earlier_batches[0]  # Первая (с самым ранним сроком)

    return {

        "fefo_compliant": False,

        "selected_batch": {

            "batch_code": selected_batch.batch_code,

            "expiry_date": selected_batch.expiry_date

        },

        "recommended_batch": {

            "batch_code": recommended.batch_code,

            "expiry_date": recommended.expiry_date,

            "volume_remaining_ml": recommended.volume_remaining_ml

        },

        "warning": f"Доступна партия {recommended.batch_code} с более ранним сроком ({recommended.expiry_date.strftime('%d.%m.%Y')}). Рекомендуется использовать её."

    }

**9.2.2 Автоматический карантин среды при контаминации культуры**

**POST /****api****/v1/****media****/****batches****/****combined****/{****batch_id****}/****quarantine**

**Request****:**

{

  "reason": "Культура BMCP-C-2024-042 контаминирована",

  "culture_id": 42

}

**Response (200 OK):**

{

  "batch_code": "MED-2024-050",

  "status": "quarantined",

  "quarantined_at": "2024-03-17T15:00:00Z",

  "investigation_task_created": true,

  "task_code": "TASK-2024-100"

}

**Backend logic:**

@router.post("/media/batches/combined/{batch_id}/quarantine")

async def quarantine_media_batch(

    batch_id: int,

    request: QuarantineMediaRequest,

    current_user: User = Depends(get_current_user)

):

    media_batch = await media_repo.get_combined_batch(batch_id)

    # Карантин среды

    media_batch.status = 'quarantined'

    media_batch.updated_at = datetime.now()

    await media_repo.update(media_batch)

    # Создание Investigation Task для QC

    task = await task_service.create_investigation_task(

        title=f"Расследование контаминации среды {media_batch.batch_code}",

        description=f"""

Определить источник контаминации:

- Готовая среда {media_batch.batch_code}?

- Компоненты (base medium, serum, additives)?

Действия:

1. Проверить стерильность готовой среды (инкубация 7 дней)

2. Если готовая среда чистая → проверить компоненты

3. Принять решение по компонентам (если виноват компонент → cascade карантин)

        """,

        culture_id=request.culture_id,

        related_entity_type='CombinedMediaBatch',

        related_entity_id=batch_id,

        assigned_to_role='qc',

        priority='high'

    )

    # Уведомление QC

    await notification_service.notify_qc_investigation(task)

    return {

        "batch_code": media_batch.batch_code,

        "status": media_batch.status,

        "quarantined_at": media_batch.updated_at,

        "investigation_task_created": True,

        "task_code": task.task_code

    }

**9.2.3 Cascade ****карантин**** ****компонента**

**POST /****api****/v1/media/components/{****component_batch_id****}/cascade-quarantine**

**Request:**

{

  "reason": "Компонент FBS-2024-008 (LOT FBS456) контаминирован",

  "lot_number": "FBS456"

}

**Response (200 OK):**

{

  "component_batch_code": "FBS-2024-008",

  "lot_number": "FBS456",

  "quarantined_components": 1,

  "quarantined_media_batches": 3,

  "affected_cultures": 5,

  "affected_culture_codes": ["BMCP-C-2024-042", "BMCP-C-2024-043", ...],

  "deviations_created": 5

}

**Backend logic:**

@router.post("/media/components/{component_batch_id}/cascade-quarantine")

async def cascade_quarantine_component(

    component_batch_id: int,

    request: CascadeQuarantineRequest,

    current_user: User = Depends(get_current_user)

):

    component_batch = await media_repo.get_component_batch(component_batch_id)

    # 1. Карантин компонента

    component_batch.status = 'quarantined'

    await media_repo.update(component_batch)

    # 2. Найти все партии с тем же LOT number

    related_batches = await media_repo.get_component_batches_by_lot(request.lot_number)

    for batch in related_batches:

        if batch.status == 'active':

            batch.status = 'quarantined'

            await media_repo.update(batch)

    # 3. Найти все готовые среды, использовавшие этот компонент

    component_ids = [component_batch.id] + [b.id for b in related_batches]

    affected_media = await media_repo.get_combined_batches_by_component_ids(component_ids)

    for media in affected_media:

        if media.status == 'active':

            media.status = 'quarantined'

            await media_repo.update(media)

    # 4. Найти все культуры, использовавшие эти среды

    media_ids = [m.id for m in affected_media]

    affected_cultures = await culture_repo.get_cultures_by_media_batch_ids(media_ids)

    for culture in affected_cultures:

        culture.status = 'hold'

        culture.risk_flag = 'critical'

        culture.risk_flag_reason = f"Карантин среды: использован контаминированный компонент {component_batch.batch_code} (LOT {request.lot_number})"

        await culture_repo.update(culture)

        # Создать Deviation

        deviation = await deviation_service.create_deviation(

            deviation_type='contamination',

            severity='critical',

            culture_id=culture.id,

            description=f"Культура на карантине: использована среда с контаминированным компонентом {component_batch.batch_code}",

            qp_review_required=True

        )

        # Уведомление QP

        await notification_service.notify_qp_deviation(deviation)

    # 5. Отчёт

    return {

        "component_batch_code": component_batch.batch_code,

        "lot_number": request.lot_number,

        "quarantined_components": len(related_batches) + 1,

        "quarantined_media_batches": len(affected_media),

        "affected_cultures": len(affected_cultures),

        "affected_culture_codes": [c.culture_code for c in affected_cultures],

        "deviations_created": len(affected_cultures)

    }

**10. РОЛИ И ПРАВА (RBAC Matrix)**

| Функция / Роль | Admin | QP | QC | Operator | Viewer |
| --- | --- | --- | --- | --- | --- |
| Управление пользователями | ✅ | ❌ | ❌ | ❌ | ❌ |
| Создание донора/донации | ✅ | ✅ | ❌ | ✅ | ❌ |
| QP проверка донации | ✅ | ✅ | ❌ | ❌ | ❌ |
| Создание культуры | ✅ | ✅ | ❌ | ✅ | ❌ |
| Выполнение процессов (пассаж, банкирование) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Обнаружение Deviation (создание) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Принятие решений по Deviation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Проведение QC тестов | ✅ | ✅ | ✅ | ❌ | ❌ |
| Утверждение QC результатов | ✅ | ✅ | ✅ | ❌ | ❌ |
| Приготовление комбинированной среды | ✅ | ✅ | ❌ | ✅ | ❌ |
| Управление инвентарём (приход) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Списание инвентаря (расход) | ✅ | ❌ | ❌ | ✅ (автоматически при выполнении шагов) | ❌ |
| Управление оборудованием | ✅ | ❌ | ❌ | ❌ | ❌ |
| Печать QR-этикеток (контейнеры, оборудование) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Создание заказа | ✅ | ✅ | ❌ | ❌ | ❌ |
| Создание выдачи (Release) | ✅ | ✅ | ❌ | ✅ | ❌ |
| QP утверждение выдачи | ✅ | ✅ | ❌ | ❌ | ❌ |
| Генерация отчётов | ✅ | ✅ | ✅ | ✅ | ✅ |
| Просмотр Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Экспорт данных (CSV, Excel) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Чтение всех данных (read-only) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Примечания:**

**Admin**: полный доступ ко всем функциям

**QP**: может принимать решения по Deviation, утверждать донации/выдачи, имеет доступ ко всем данным

**QC**: проводит и утверждает тесты, может создавать Deviation

**Operator**: выполняет все операционные задачи (процессы, инвентарь), но не может принимать решения по качеству

**Viewer**: read-only доступ, может генерировать отчёты для ознакомления

**11. ИНТЕГРАЦИИ**

**11.1 ****Telegram**** ****Bot**** (****aiogram****)**

**Функциональность:**

**Регистрация пользователей:**

QP/QC отправляет /start в боте

Бот генерирует verification_code (6-значный)

Пользователь вводит код в личном кабинете BMCP

Backend связывает telegram_id с user_id

Бот подтверждает: "✅ Аккаунт подключён"

**Уведомления QP:**

Критические Deviation (CCA fail, контаминация)

Inline кнопки для быстрого принятия решений

FSM для ввода комментариев

**Уведомления QC:**

Новые задачи расследований (Investigation Tasks)

Напоминания о просроченных тестах

**Уведомления Операторов (опционально):**

Задачи (например, "Переместить контейнер в карантин")

Напоминания о сроках годности сред

**Уведомления Заказчикам (опционально):**

Статус заказа (в производстве, готов к выдаче, задержка)

Требует регистрации заказчика в боте и связи с Order

**Архитектура:**

Отдельный контейнер telegram-bot (aiogram long polling)

Взаимодействие с backend через внутренний API (не публичный)

Redis для FSM states

**Команды:**

/start - Регистрация

/status - Мой статус (роль, активные Deviations)

/help - Помощь

**11.2 Принтеры этикеток**

**Zebra**** (ZPL):**

Протокол: TCP/IP (порт 9100) или USB

Библиотека: zpl (Python)

Генерация QR: ^BQ команда в ZPL

Формат этикетки: 50x70mm для контейнеров, 25x50mm для криовиал

Пример ZPL:

^XA

^FO50,50^BQN,2,6^FDQA,{"container_id":123}^FS

^FO50,250^FDT75-042-P4-1^FS

^FO50,300^FDBMCP-C-2024-042^FS

^FO50,350^FDP4 | 15.03.24^FS

^XZ

**DYMO (PDF):**

Генерация PDF с QR-кодом (ReportLab)

Отправка на DYMO через CUPS (Linux) или DYMO SDK (Windows)

Формат: A4 для разрезания или прямая печать на DYMO LabelWriter

**Backend service (barcode_service.py):**

class BarcodeService:

    def print_container_label(self, container: Container, printer_type: str):

        if printer_type == 'zebra':

            zpl = self._generate_zpl_container(container)

            self._send_to_zebra_printer(zpl)

        elif printer_type == 'dymo':

            pdf = self._generate_pdf_container(container)

            self._send_to_dymo_printer(pdf)

    def _generate_zpl_container(self, container: Container) -> str:

        qr_data = json.dumps(container.qr_code_data)

        return f"""

^XA

^FO50,50^BQN,2,6^FDQA,{qr_data}^FS

^FO50,250^FD{container.container_code}^FS

^FO50,300^FD{container.culture.culture_code}^FS

^FO50,350^FDP{container.passage_number} | {container.created_at.strftime('%d.%m.%y')}^FS

^XZ

        """

    def _send_to_zebra_printer(self, zpl: str):

        # TCP/IP socket

        import socket

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        sock.connect(('192.168.1.100', 9100))  # IP принтера

        sock.send(zpl.encode())

        sock.close()

**11.3 ****Email**** уведомления (SMTP)**

**Функциональность:**

Дублирование Telegram уведомлений (на случай если QP не в Telegram)

Отправка отчётов (PDF вложения)

Регистрация новых пользователей (подтверждение email)

**Настройка (SMTP):**

Провайдер: Gmail, SendGrid, AWS SES, или корпоративный SMTP

Параметры в .env:

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_USER=bmcp@company.com

SMTP_PASSWORD=***

SMTP_TLS=True

**Backend service (notification_service.py):**

import smtplib

from email.mime.text import MIMEText

from email.mime.multipart import MIMEMultipart

from email.mime.application import MIMEApplication

class NotificationService:

    def send_email(self, to: str, subject: str, body: str, attachment_path: str = None):

        msg = MIMEMultipart()

        msg['From'] = settings.SMTP_USER

        msg['To'] = to

        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        if attachment_path:

            with open(attachment_path, 'rb') as f:

                attach = MIMEApplication(f.read(), _subtype="pdf")

                attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(attachment_path))

                msg.attach(attach)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:

            server.starttls()

            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

            server.send_message(msg)

**12. ****ПЛАН**** ****РАЗВЕРТЫВАНИЯ**** (CI/CD)**

**12.1 Окружения**

| Окружение | Назначение | URL | Деплой |
| --- | --- | --- | --- |
| Development | Локальная разработка | localhost | Вручную |
| Staging | Тестирование | https://staging.bmcp.lab | Автоматически при merge в develop |
| Production | Рабочая система | https://bmcp.lab | Вручную (approval) при merge в main |

**12.2 CI/CD Pipeline (GitHub Actions)**

**Файл****: .****github****/workflows/****deploy.yml**

name: Deploy BMCP

on:

  push:

    branches: [develop, main]

  pull_request:

    branches: [develop, main]

jobs:

  lint-and-test:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - name: Set up Python

        uses: actions/setup-python@v4

        with:

          python-version: '3.11'

      - name: Install dependencies

        run: |

          cd backend

          pip install -r requirements.txt

          pip install pytest pytest-asyncio pytest-cov

      - name: Run linters

        run: |

          cd backend

          flake8 app

          mypy app

      - name: Run tests

        run: |

          cd backend

          pytest --cov=app --cov-report=xml

      - name: Upload coverage

        uses: codecov/codecov-action@v3

        with:

          files: ./backend/coverage.xml

  lint-frontend:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - name: Set up Node.js

        uses: actions/setup-node@v3

        with:

          node-version: '20'

      - name: Install dependencies

        run: |

          cd frontend

          npm ci

      - name: Run ESLint

        run: |

          cd frontend

          npm run lint

      - name: Run tests

        run: |

          cd frontend

          npm run test

  build-and-push:

    needs: [lint-and-test, lint-frontend]

    if: github.event_name == 'push'

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v3

      - name: Set up Docker Buildx

        uses: docker/setup-buildx-action@v2

      - name: Login to GitHub Container Registry

        uses: docker/login-action@v2

        with:

          registry: ghcr.io

          username: ${{ github.actor }}

          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend

        uses: docker/build-push-action@v4

        with:

          context: ./backend

          push: true

          tags: ghcr.io/${{ github.repository }}/backend:${{ github.ref_name }}

      - name: Build and push frontend

        uses: docker/build-push-action@v4

        with:

          context: ./frontend

          push: true

          tags: ghcr.io/${{ github.repository }}/frontend:${{ github.ref_name }}

  deploy-staging:

    needs: build-and-push

    if: github.ref == 'refs/heads/develop'

    runs-on: ubuntu-latest

    steps:

      - name: Deploy to Staging

        uses: appleboy/ssh-action@master

        with:

          host: ${{ secrets.STAGING_HOST }}

          username: ${{ secrets.STAGING_USER }}

          key: ${{ secrets.STAGING_SSH_KEY }}

          script: |

            cd /opt/bmcp

            docker-compose pull

            docker-compose up -d

            docker-compose exec backend alembic upgrade head

  deploy-production:

    needs: build-and-push

    if: github.ref == 'refs/heads/main'

    runs-on: ubuntu-latest

    environment:

      name: production

      url: https://bmcp.lab

    steps:

      - name: Deploy to Production

        uses: appleboy/ssh-action@master

        with:

          host: ${{ secrets.PROD_HOST }}

          username: ${{ secrets.PROD_USER }}

          key: ${{ secrets.PROD_SSH_KEY }}

          script: |

            cd /opt/bmcp

            docker-compose pull

            docker-compose up -d

            docker-compose exec backend alembic upgrade head

      - name: Run smoke tests

        run: |

          curl -f https://bmcp.lab/api/health || exit 1

**12.3 Docker Compose (Production)**

**Файл****: docker-****compose.yml**

version: '3.8'

services:

  postgres:

    image: postgres:15-alpine

    environment:

      POSTGRES_USER: bmcp

      POSTGRES_PASSWORD: ${DB_PASSWORD}

      POSTGRES_DB: bmcp_prod

    volumes:

      - postgres_data:/var/lib/postgresql/data

    ports:

      - "5432:5432"

    restart: always

  redis:

    image: redis:7-alpine

    ports:

      - "6379:6379"

    restart: always

  backend:

    image: ghcr.io/your-org/bmcp/backend:main

    environment:

      DATABASE_URL: postgresql+asyncpg://bmcp:${DB_PASSWORD}@postgres:5432/bmcp_prod

      REDIS_URL: redis://redis:6379/0

      SECRET_KEY: ${SECRET_KEY}

      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

      SMTP_USER: ${SMTP_USER}

      SMTP_PASSWORD: ${SMTP_PASSWORD}

    depends_on:

      - postgres

      - redis

    ports:

      - "8000:8000"

    restart: always

    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  celery-worker:

    image: ghcr.io/your-org/bmcp/backend:main

    environment:

      DATABASE_URL: postgresql+asyncpg://bmcp:${DB_PASSWORD}@postgres:5432/bmcp_prod

      REDIS_URL: redis://redis:6379/0

      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

    depends_on:

      - postgres

      - redis

    restart: always

    command: celery -A app.tasks.celery_app worker --loglevel=info

  celery-beat:

    image: ghcr.io/your-org/bmcp/backend:main

    environment:

      DATABASE_URL: postgresql+asyncpg://bmcp:${DB_PASSWORD}@postgres:5432/bmcp_prod

      REDIS_URL: redis://redis:6379/0

    depends_on:

      - postgres

      - redis

    restart: always

    command: celery -A app.tasks.celery_app beat --loglevel=info

  telegram-bot:

    image: ghcr.io/your-org/bmcp/backend:main

    environment:

      DATABASE_URL: postgresql+asyncpg://bmcp:${DB_PASSWORD}@postgres:5432/bmcp_prod

      REDIS_URL: redis://redis:6379/0

      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

    depends_on:

      - postgres

      - redis

    restart: always

    command: python -m app.telegram.bot

  frontend:

    image: ghcr.io/your-org/bmcp/frontend:main

    ports:

      - "80:80"

      - "443:443"

    volumes:

      - ./nginx.conf:/etc/nginx/nginx.conf:ro

      - ./ssl:/etc/nginx/ssl:ro

    depends_on:

      - backend

    restart: always

volumes:

  postgres_data:

**13. ТЕСТИРОВАНИЕ**

**13.1 Стратегия тестирования**

| Тип тестов | Инструменты | Покрытие | Когда запускать |
| --- | --- | --- | --- |
| Unit tests | Pytest (backend), Vitest (frontend) | 80%+ критической логики | При каждом commit (pre-commit hook) |
| Integration tests | Pytest + httpx (API), React Testing Library (UI) | Ключевые сценарии (процессы, Deviation workflow) | В CI/CD pipeline |
| E2E tests | Playwright или Cypress | Happy path (создание культуры → пассаж → MCB → выдача) | Перед деплоем в production |
| Manual QA | Test cases в Notion/Jira | Все новые фичи | Перед каждым релизом |

**13.2 Примеры тестов**

**Backend**** ****unit**** ****test**** (****pytest****):**

# tests/services/test_culture_service.py

import pytest

from app.services.culture_service import CultureService

@pytest.mark.asyncio

async def test_create_culture(db_session, mock_donation):

    service = CultureService(db_session)

    culture_in = CultureCreate(

        donation_id=mock_donation.id,

        cell_type="MSC",

        tissue_source="Bone marrow"

    )

    culture = await service.create_culture(culture_in, user_id=1)

    assert culture.culture_code.startswith("BMCP-C-")

    assert culture.current_passage == 0

    assert culture.status == "active"

    assert culture.risk_flag == "none"

**Backend integration test (API):**

# tests/api/test_deviations.py

import pytest

from httpx import AsyncClient

@pytest.mark.asyncio

async def test_qp_decision_continue(async_client: AsyncClient, mock_deviation, qp_token):

    response = await async_client.post(

        f"/api/v1/deviations/{mock_deviation.id}/qp-decision",

        json={

            "decision": "continue",

            "notes": "Viability acceptable for this cell type"

        },

        headers={"Authorization": f"Bearer {qp_token}"}

    )

    assert response.status_code == 200

    data = response.json()

    assert data["qp_review_decision"] == "continue"

    assert data["culture_risk_flag"] is None  # Флаг снят

**Frontend unit test (****Vitest**** + React Testing Library):**

// tests/components/CultureCard.test.tsx

import { render, screen } from '@testing-library/react';

import { CultureCard } from '@/components/CultureCard';

test('renders culture code and status', () => {

  const culture = {

    culture_code: 'BMCP-C-2024-042',

    status: 'active',

    risk_flag: 'none',

  };

  render(<CultureCard culture={culture} />);

  expect(screen.getByText('BMCP-C-2024-042')).toBeInTheDocument();

  expect(screen.getByText('Активна')).toBeInTheDocument();

});

test('shows risk flag if present', () => {

  const culture = {

    culture_code: 'BMCP-C-2024-042',

    status: 'active',

    risk_flag: 'at_risk',

  };

  render(<CultureCard culture={culture} />);

  expect(screen.getByText('⚠️ На риске')).toBeInTheDocument();

});

**E2E test (Playwright):**

// e2e/culture-workflow.spec.ts

import { test, expect } from '@playwright/test';

test('complete culture workflow: create → passage → MCB', async ({ page }) => {

  // Login

  await page.goto('https://bmcp.lab/login');

  await page.fill('input[name="username"]', 'operator');

  await page.fill('input[name="password"]', 'password');

  await page.click('button[type="submit"]');

  // Create culture

  await page.click('text=Создать культуру');

  await page.selectOption('select[name="donation_id"]', '1');

  await page.fill('input[name="cell_type"]', 'MSC');

  await page.click('button:has-text("Создать")');

  // Verify culture created

  await expect(page.locator('text=BMCP-C-')).toBeVisible();

  // Navigate to passage

  await page.click('text=Пассировать');

  // Execute passage process (simplified)

  await page.click('button:has-text("Начать процесс")');

  // ... (заполнение шагов)

  // Verify passage completed

  await expect(page.locator('text=Пассаж завершён успешно')).toBeVisible();

});

**14. ОБУЧЕНИЕ И ДОКУМЕНТАЦИЯ**

**14.1 Документация для пользователей**

**User ****Manual**** (PDF):**

Для каждой роли (Operator, QC, QP, Admin)

Структура: 

Введение (что такое BMCP Platform)

Вход в систему

Навигация (меню, поиск, фильтры)

Основные задачи: 

Operator: Создание культуры, пассирование, банкирование

QC: Проведение тестов, расследования

QP: Принятие решений по Deviation, утверждение выдач

Admin: Управление пользователями, настройка системы

Часто задаваемые вопросы (FAQ)

Контакты службы поддержки

**Видеоинструкции:**

Скринкасты для ключевых сценариев (5-10 минут каждый): 

"Как создать культуру из донации"

"Как выполнить пассаж культуры"

"Как приготовить комбинированную среду"

"Как принять решение по Deviation (для QP)"

Хостинг: внутренний видеосервер или YouTube (unlisted)

**Встроенная помощь (UI):**

Tooltips (ⓘ) на сложных полях

Контекстная помощь (кнопка "?" в правом верхнем углу)

Поиск по документации (встроенный в систему)

**14.2 Техническая документация**

**API ****Reference****:**

Автогенерация из OpenAPI (Swagger/Redoc)

URL: https://bmcp.lab/api/docs

Включает: 

Все endpoints (описание, параметры, примеры запросов/ответов)

Схемы данных (Pydantic models)

Коды ошибок

**Architecture ****Decision**** Records (ADR):**

Формат: Markdown файлы в репозитории (docs/adr/)

Примеры: 

001-choice-of-fastapi-over-django.md

002-telegram-bot-for-qp-notifications.md

003-separate-container-for-celery-workers.md

Структура ADR: 

Контекст (проблема)

Рассмотренные варианты

Решение (выбранный вариант)

Обоснование

Последствия

**Database ****Schema**** ****Diagrams****:**

Генерация из БД:  или 

ER-диаграммы в формате PNG/SVG (в docs/database/)

**Developer Guide:**

 в корне репозитория: 

Как запустить проект локально

Структура кода

Правила контрибуции

: 

Code style (PEP 8 для Python, Airbnb для TypeScript)

Git workflow (feature branches, pull requests)

Процесс review

**14.3 План обучения**

**Онбординг**** новых операторов (2 дня):**

**День 1:** 

Теория (2 часа): GMP principles, жизненный цикл культуры, структура BMCP

Практика (6 часов): Работа в демо-окружении (staging) 

Создание культуры

Выполнение процессов (с подсказками тренера)

Сканирование QR-кодов

**День 2:** 

Практика (6 часов): Самостоятельная работа в staging 

Полный цикл: донация → культура → пассажи → MCB

Тестирование (1 час): Квиз (10 вопросов, минимум 8 правильных для прохождения)

Выдача доступа к production (если тест пройден)

**Онбординг**** QC/QP (1 день):**

**Теория (2 часа):** Deviation workflow, CCA rules, карантин сред

**Практика (4 часа):** Работа в staging 

QC: Проведение тестов, расследования

QP: Принятие решений по Deviation (через UI и Telegram)

**Тестирование (1 час):** Квиз + практическое задание (принять решение по mock Deviation)

**Периодические тренинги (ежеквартально):**

Обзор новых фич (1 час)

Разбор реальных Deviation (case studies, 1 час)

Q&A сессия (30 минут)

**15. МИГРАЦИЯ ДАННЫХ (если применимо)**

**Если есть ****legacy**** система (Excel, старая БД):**

**15.1 План миграции**

**Анализ источника:**

Инвентаризация данных (какие таблицы/листы, какие поля)

Оценка объёма (количество записей)

Выявление проблем (дубликаты, несогласованные данные, отсутствующие поля)

**Маппинг данных:**

Таблица соответствия: Legacy Field → BMCP Field

Примеры: 

Excel "Culture ID" → cultures.culture_code

Excel "Donor Birth Year" → donors.birth_year

Правила трансформации: 

Даты: из формата "DD/MM/YYYY" в ISO "YYYY-MM-DD"

Статусы: маппинг ("В работе" → "active", "Заморожена" → "frozen")

**Скрипты миграции:**

Язык: Python (pandas для чтения Excel, SQLAlchemy для записи в БД)

Структура:

migration_scripts/

├── 001_migrate_donors.py

├── 002_migrate_donations.py

├── 003_migrate_cultures.py

├── 004_migrate_containers.py

└── run_all.sh

**Валидация:**

После миграции: автоматические проверки 

Количество записей совпадает

Нет битых foreign keys

Обязательные поля заполнены

Ручная проверка (sample): 10% записей проверяется вручную

**Откат (****Rollback****):**

Бэкап БД перед миграцией

Если миграция провалилась → восстановление из бэкапа

**Пример**** ****скрипта**** ****миграции****:**

# migration_scripts/001_migrate_donors.py

import pandas as pd

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.models.donor import Donor

async def migrate_donors(excel_path: str):

    # Чтение Excel

    df = pd.read_excel(excel_path, sheet_name='Donors')

    # Подключение к БД

    engine = create_async_engine("postgresql+asyncpg://...")

    async with AsyncSession(engine) as session:

        for _, row in df.iterrows():

            donor = Donor(

                donor_code=f"DON-{row['Year']}-{row['Number']:03d}",

                birth_year=int(row['Birth Year']),

                sex=row['Sex'].lower(),

                blood_type=row.get('Blood Type'),

                consent_form_url=row.get('Consent URL'),

                is_active=True

            )

            session.add(donor)

        await session.commit()

    print(f"Migrated {len(df)} donors")

if __name__ == "__main__":

    import asyncio

    asyncio.run(migrate_donors("legacy_data.xlsx"))

**Если это ****greenfield**** проект:**

Раздел 15 не применим, можно опустить

**16. ПРИЛОЖЕНИЯ**

**16.1 Словарь терминов (полный)**

| Термин (EN) | Термин (RU) | Описание |
| --- | --- | --- |
| Culture | Культура | Клеточная линия, полученная от донора, проходящая полный жизненный цикл |
| Passage | Пассаж | Процесс переноса клеток в новый контейнер с разведением (например, 1:3) |
| Container | Контейнер | Физический сосуд с клетками (флакон T75, криовиала, биореактор) |
| MCB | Главный банк клеток | Master Cell Bank — базовая заморозка культуры (обычно P3-P5) |
| WCB | Рабочий банк клеток | Working Cell Bank — размороженный MCB для производства |
| CCA | Проверка критических критериев | Critical Criteria Assessment — автоматическая проверка параметров (viability, cell count) |
| FEFO | Первым истекает — первым расходуется | First Expired First Out — принцип использования материалов по сроку годности |
| QP | Уполномоченное лицо | Qualified Person — принимает решения по качеству (Deviation, выдачи) |
| QC | Контроль качества | Quality Control — проводит лабораторные тесты |
| Deviation | Отклонение | Зафиксированное отклонение от нормы (CCA fail, контаминация, нарушение процесса) |
| SOP | Стандартная операционная процедура | Standard Operating Procedure — детальная инструкция для процесса |
| GMP | Надлежащая производственная практика | Good Manufacturing Practice — международные стандарты качества |
| Donor | Донор | Человек, предоставивший биоматериал |
| Donation | Донация | Конкретный акт получения биоматериала от донора |
| Confluence | Конфлюэнтность | Степень заполнения поверхности флакона клетками (обычно 80-90% для пассажа) |
| Viability | Жизнеспособность | Процент живых клеток (обычно норма ≥80%) |
| Cryopreservation | Криоконсервация | Заморозка клеток для долгосрочного хранения |
| Thawing | Размораживание | Процесс восстановления клеток из замороженного состояния |
| Laminar Hood | Ламинарный бокс | Стерильная рабочая зона для манипуляций с клетками |
| Incubator | Инкубатор | Устройство для культивирования клеток (37°C, 5% CO2) |
| Contamination | Контаминация | Загрязнение культуры (бактерии, грибы, микоплазма) |
| Sterility | Стерильность | Отсутствие микробного загрязнения |
| Serology | Серология | Тесты на инфекции (HIV, HBV, HCV, сифилис) |
| LOT number | Номер партии | Идентификатор партии от поставщика (для прослеживаемости) |
| Batch | Партия | Группа материалов/сред, приготовленных одновременно |
| Expiry date | Срок годности | Дата, после которой материал нельзя использовать |
| Release | Выдача | Передача готового клеточного продукта заказчику |
| Certificate of Analysis | Сертификат анализа | Документ с результатами всех тестов QC |
| Audit Log | Журнал аудита | Запись всех действий в системе (GMP requirement) |
| RBAC | Управление доступом на основе ролей | Role-Based Access Control — разграничение прав по ролям |
| EBR | Электронная партийная запись | Electronic Batch Record — цифровая история производства |
| Traceability | Прослеживаемость | Возможность проследить путь культуры от донора до выдачи |

**16.2 UI ****Mockups**** (текстовое описание)**

**Главная страница (****Dashboard****):**

┌─────────────────────────────────────────────────────────┐

│  BMCP Platform       [🔔] [👤 Иванов И.]         [⚙️]   │

├─────────────────────────────────────────────────────────┤

│  [Главная] [Культуры] [Процессы] [Среды] [Отклонения]  │

├─────────────────────────────────────────────────────────┤

│                                                         │

│  📊 СТАТИСТИКА                                          │

│  ┌───────────┬───────────┬───────────┬───────────┐     │

│  │ Активных  │ Заказов   │ Задач     │ Отклонений│     │

│  │ культур   │ в произв. │ на сегодня│ открытых  │     │

│  │    42     │     8     │     15    │     3     │     │

│  └───────────┴───────────┴───────────┴───────────┘     │

│                                                         │

│  📅 ЗАДАЧИ НА СЕГОДНЯ                                   │

│  ┌───────────────────────────────────────────────────┐ │

│  │ ⏰ 10:00 - Подкормка культуры BMCP-C-2024-042     │ │

│  │ ⏰ 14:00 - QC тест стерильности MED-2024-050      │ │

│  │ ⚠️ ПРОСРОЧЕНО - Переместить T75-042-P4-1 в карантин││

│  └───────────────────────────────────────────────────┘ │

│                                                         │

│  ⚠️ ОТКЛОНЕНИЯ (требуют внимания)                       │

│  ┌───────────────────────────────────────────────────┐ │

│  │ DEV-2024-088 | BMCP-C-2024-042 | CCA fail         │ │

│  │ Статус: Ожидает решения QP                        │ │

│  │ [Подробнее]                                       │ │

│  └───────────────────────────────────────────────────┘ │

│                                                         │

│  📈 ГРАФИКИ                                             │

│  [Культуры по статусам] [Пассажи по неделям]          │

│                                                         │

└─────────────────────────────────────────────────────────┘

**Карточка культуры:**

┌─────────────────────────────────────────────────────────┐

│  ← Назад к списку                                       │

│                                                         │

│  КУЛЬТУРА BMCP-C-2024-042                               │

│  Статус: Активна 🟢  | Риск: Нет                       │

├─────────────────────────────────────────────────────────┤

│                                                         │

│  [Общая информация] [Контейнеры] [История] [QC тесты]  │

│                                                         │

│  ──────────────────────────────────────────────────────│

│                                                         │

│  Тип клеток: MSC (Мезенхимальные стволовые клетки)     │

│  Источник ткани: Костный мозг                          │

│  Текущий пассаж: P4                                     │

│  Донация: DONAT-2024-010 [Открыть]                     │

│  Заказ: ORD-2024-015 [Открыть]                         │

│  Создано: 11.01.2024 (66 дней назад)                   │

│  Последнее обновление: 17.03.2024 15:30                │

│                                                         │

│  Среда: MED-2024-050 (DMEM + 10% FBS)                  │

│  Срок годности среды: 01.04.2024 (15 дней)             │

│                                                         │

│  ──────────────────────────────────────────────────────│

│                                                         │

│  КОНТЕЙНЕРЫ (4 активных)                                │

│  ┌───────────────┬─────────┬───────────┬──────────┐    │

│  │ Код           │ Тип     │ Локация   │ Статус   │    │

│  ├───────────────┼─────────┼───────────┼──────────┤    │

│  │ T75-042-P4-1  │ T75     │ INC-01-S2 │ Активен  │    │

│  │ T75-042-P4-2  │ T75     │ INC-01-S2 │ Активен  │    │

│  │ CRYO-042-MCB-1│ Криовиал│ FREEZER-80│ Заморожен│    │

│  │ CRYO-042-MCB-2│ Криовиал│ FREEZER-80│ Заморожен│    │

│  └───────────────┴─────────┴───────────┴──────────┘    │

│                                                         │

│  ──────────────────────────────────────────────────────│

│                                                         │

│  ДЕЙСТВИЯ                                               │

│  [Пассировать] [Подкормка] [Банкировать] [QC тест]     │

│                                                         │

└─────────────────────────────────────────────────────────┘

**Форма выполнения процесса (Пассаж):**

┌─────────────────────────────────────────────────────────┐

│  ПАССИРОВАНИЕ КУЛЬТУРЫ BMCP-C-2024-042                  │

│  Процесс: EXEC-2024-150 | Статус: В процессе           │

├─────────────────────────────────────────────────────────┤

│                                                         │

│  Шаг 3/8: Подсчёт клеток ⚠️ КРИТИЧЕСКИЙ ШАГ            │

│                                                         │

│  Описание:                                              │

│  Подсчитайте концентрацию и жизнеспособность клеток     │

│  (SOP-042 §3.2)                                         │

│                                                         │

│  ──────────────────────────────────────────────────────│

│                                                         │

│  Контейнер: T75-042-P3-1                                │

│                                                         │

│  Концентрация клеток (cells/ml)*:                       │

│  ┌─────────────────────────────────────────┐           │

│  │ 5000000                                  │           │

│  └─────────────────────────────────────────┘           │

│                                                         │

│  Жизнеспособность (%)*:                                 │

│  ┌─────────────────────────────────────────┐           │

│  │ 75                                       │  ⚠️< 80% │

│  └─────────────────────────────────────────┘           │

│                                                         │

│  Объём суспензии (ml)*:                                 │

│  ┌─────────────────────────────────────────┐           │

│  │ 15                                       │           │

│  └─────────────────────────────────────────┘           │

│                                                         │

│  ☑️ Применить ко всем контейнерам                       │

│                                                         │

│  [Назад] [Завершить шаг]                                │

│                                                         │

└─────────────────────────────────────────────────────────┘

**16.3 Примеры форм (JSON ****schemas****)**

**Создание**** ****культуры****:**

{

  "donation_id": 10,

  "cell_type": "MSC",

  "tissue_source": "Bone marrow",

  "order_id": 15

}

**Создание комбинированной среды:**

{

  "media_recipe_id": 1,

  "volume_ml": 1000.0,

  "expiry_date": "2024-04-01",

  "storage_location_id": 5,

  "components": [

    {

      "media_component_batch_id": 12,

      "quantity_used": 900.0,

      "unit": "ml"

    },

    {

      "media_component_batch_id": 8,

      "quantity_used": 100.0,

      "unit": "ml"

    },

    {

      "media_component_batch_id": 5,

      "quantity_used": 10.0,

      "unit": "ml"

    }

  ]

}

**Принятие**** ****решения**** QP ****по**** Deviation:**

{

  "decision": "continue",

  "notes": "Жизнеспособность на границе нормы (78%). Принято решение продолжить под усиленным наблюдением. Следующий контроль через 48 часов.",

  "root_cause": "Возможно, стресс клеток из-за длительного пассирования",

  "corrective_action": "Повторная проверка жизнеспособности через 48 часов",

  "preventive_action": "Сократить интервал между пассажами до 3 дней"

}

**17. ПРОВЕРКА ПОЛНОТЫ ТЗ**

**Чеклист**** полноты:**

✅ **1. Введение**

✅ Назначение документа

✅ Область применения

✅ Цели проекта, метрики успеха

✅ Определения и сокращения

✅ **2. Концептуальная модель**

✅ Все основные сущности (26 таблиц)

✅ Атрибуты сущностей

✅ Связи между сущностями

✅ Статусы культуры и контейнера

✅ Флаг риска (risk_flag) с логикой

✅ Этапы жизненного цикла

✅ **3. Детальное описание бизнес-процессов**

✅ Регистрация донора/донации (с асинхронной QP проверкой)

✅ Создание первичной культуры

✅ Пассирование (с CCA, сканированием оборудования, FEFO)

✅ Банкирование MCB/WCB

✅ Размораживание

✅ Приготовление комбинированной среды

✅ Карантин среды при контаминации (с cascade логикой)

✅ **4. Детальные пользовательские сценарии**

✅ Общий жизненный цикл культуры

✅ Превышение CCA с Telegram-уведомлением QP (детальный flow)

✅ QP решение через Telegram и Web

✅ **5. Функциональные требования**

✅ Модуль: Комбинированные среды (CRUD, FEFO, карантин, cascade)

✅ Модуль: Оборудование (печать QR, сканирование, валидация)

✅ Модуль: Донация (без блокирующего QP approval)

✅ Модуль: Отклонения (Deviations)

✅ Модуль: Прослеживаемость (история культуры, среды)

✅ Модуль: Задачи (Tasks)

✅ Модуль: Отчёты и аналитика

✅ **6. Нефункциональные требования**

✅ Производительность

✅ Безопасность

✅ Доступность (Availability)

✅ Масштабируемость

✅ Совместимость

✅ Удобство использования (Usability)

✅ Доступность (Accessibility)

✅ Адаптивность (Responsive)

✅ **7. Технический стек**

✅ Backend (Python, FastAPI, PostgreSQL, Celery, Redis)

✅ Frontend (React, TypeScript, Tailwind CSS)

✅ Инфраструктура (Docker, CI/CD, мониторинг)

✅ **8. Архитектура системы**

✅ High-level схема

✅ Слои приложения (API, Service, Repository)

✅ Модель данных (DDL для ключевых таблиц)

✅ Celery tasks

✅ Telegram bot architecture

✅ **9. API Спецификация**

✅ Endpoints: Equipment (новые: print-label, validate-scan)

✅ Endpoints: Media (FEFO валидация, карантин, cascade)

✅ Endpoints: Deviations (QP решения)

✅ Примеры request/response

✅ **10. Роли и права (RBAC)**

✅ Матрица прав для 5 ролей (Admin, QP, QC, Operator, Viewer)

✅ **11. Интеграции**

✅ Telegram bot (регистрация, уведомления, команды)

✅ Принтеры этикеток (Zebra ZPL, DYMO PDF)

✅ Email уведомления (SMTP)

✅ **12. План развертывания**

✅ Окружения (Dev, Staging, Production)

✅ CI/CD pipeline (GitHub Actions)

✅ Docker Compose (production)

✅ **13. Тестирование**

✅ Стратегия (unit, integration, E2E)

✅ Примеры тестов (Pytest, Vitest, Playwright)

✅ **14. Обучение и документация**

✅ User Manual

✅ Видеоинструкции

✅ Техническая документация (API Reference, ADR, DB schemas)

✅ План обучения (операторы, QC/QP, периодические тренинги)

✅ **15. Миграция данных** (опционально, если есть legacy)

✅ План миграции

✅ Пример скрипта

✅ **16. Приложения**

✅ Словарь терминов (полный)

✅ UI Mockups (текстовое описание)

✅ Примеры форм (JSON schemas)

✅ **17. Критические доработки по замечаниям**

✅ Штрих-коды оборудования (печать, сканирование, валидация)

✅ Карантин среды при контаминации (автоматический + cascade)

✅ QP approval донации (асинхронно, не блокирующий)

✅ Флаг риска at_risk (отдельное поле, логика работы)

**ИТОГ**

**Техническое задание BMCP Platform завершено и готово к использованию.**

**Объём:** ~35,000 слов (≈70 страниц A4 в Word)

**Статус:** ✅ **100% готовности**

Все критические замечания интегрированы:

✅ СОПы и штрих-коды оборудования

✅ Карантин сред с cascade логикой

✅ QP проверка донации (асинхронная)

✅ Флаг риска at_risk

Документ содержит полную спецификацию для разработки системы управления производством биомедицинских клеточных продуктов с соблюдением GMP требований.

**ТЕКСТ ДЛЯ КОПИРОВАНИЯ В WORD**

Скопируйте весь текст выше (начиная с заголовка "# ТЕХНИЧЕСКОЕ ЗАДАНИЕ...") и вставьте в Microsoft Word. Затем:

**Примените стили:**

Заголовок 1: # строки (например, "## 1. ВВЕДЕНИЕ")

Заголовок 2: ## строки (например, "### 1.1 Назначение документа")

Заголовок 3: ### строки

**Форматирование таблиц:**

Таблицы в Markdown формате нужно переформатировать в Word (Вставка → Таблица)

**Форматирование кода:**

Блоки кода (обрамлённые тройными backticks) → Courier New, серый фон

**Нумерация страниц:**

Вставка → Номер страницы

**Оглавление:**

Ссылки → Оглавление (автогенерация из заголовков)

**Финальная проверка:**

Проверка орфографии (Рецензирование → Правописание)

Экспорт в PDF (для финальной версии)

**ФИКС 01 от 08.01.26 (ГПТ5.2)**

Ниже — **фикс-предложение прямо к вашему ТЗ/DDL**, исходя из приложенного фрагмента (таблицы executed_steps, deviations, containers, сценарий Step 3 “подсчёт клеток” и CCA). Пишу так, чтобы это можно было вставить в раздел БД/логики/UX как Change Request.

**CR-001: Результаты критических шагов должны храниться на уровне “контейнер × шаг”**

**1) Причина (обоснование)**

В сценарии шагов (например, **Step 3: подсчёт клеток**) оператор вводит параметры **по каждому контейнеру** (T75-…-1, T75-…-2).
Текущая модель executed_steps.recorded_parameters JSONB + cca_passed не позволяет корректно:

фиксировать **разные значения** для разных контейнеров в одном шаге;

вычислять/хранить CCA pass/fail по контейнеру;

создавать Deviation только для проблемного контейнера, не “роняя” весь шаг;

обеспечивать ALCOA+ (кто/когда ввёл значение по конкретному контейнеру).

**2) Изменение модели данных (DDL)**

**Вариант рекомендуемый: добавить таблицу результатов по контейнерам**

Добавить таблицу:

CREATE TABLE executed_step_container_results (

  id SERIAL PRIMARY KEY,

  executed_step_id INTEGER NOT NULL REFERENCES executed_steps(id) ON DELETE CASCADE,

  container_id INTEGER NOT NULL REFERENCES containers(id),

  status VARCHAR(20) NOT NULL DEFAULT 'draft', 

  -- draft | completed | failed_cca | voided

  recorded_parameters JSONB,      -- фактические значения (концентрация, viability, объём и т.п.)

  cca_passed BOOLEAN,

  cca_results JSONB,              -- массив/объект по каждому CCA-правилу

  created_by_user_id INTEGER REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),

  completed_by_user_id INTEGER REFERENCES users(id),

  completed_at TIMESTAMP

);

CREATE UNIQUE INDEX uq_escr_step_container 

ON executed_step_container_results(executed_step_id, container_id);

CREATE INDEX idx_escr_container ON executed_step_container_results(container_id);

CREATE INDEX idx_escr_step ON executed_step_container_results(executed_step_id);

**Изменения в ****executed_steps**

Поля в executed_steps оставить для **метаданных шага**:

scanned_equipment_id, equipment_scan_timestamp, notes, status, sop_confirmed_at.

Поля recorded_parameters, cca_passed, cca_results:

либо **депрекейтнуть** (оставить null для шагов, которые “по контейнерам”),

либо использовать только для шагов, где измерение действительно одно на шаг (например, скан оборудования).

Рекомендация к ТЗ:

“Если шаг предполагает ввод измерений/данных по нескольким контейнерам, все измерения и результаты CCA хранятся в executed_step_container_results, а не в executed_steps.”

**CR-002: CCA ****fail**** не должен переводить контейнер в “****blocked****” как финальное качество-решение (RBAC/QP)**

**1) Причина**

Сейчас логика “CCA fail → container.status='blocked'” воспринимается как **финальная блокировка**.
По RBAC оператор не должен принимать качественное решение; при этом система должна уметь **технически остановить** дальнейшее использование контейнера до ревью QP.

**2) Изменения в контейнере (минимальные)**

В containers добавить поля “quality hold”:

ALTER TABLE containers

ADD COLUMN quality_hold VARCHAR(20) NOT NULL DEFAULT 'none',

-- none | system | qp

ADD COLUMN hold_reason TEXT,

ADD COLUMN hold_set_at TIMESTAMP,

ADD COLUMN hold_set_by_user_id INTEGER REFERENCES users(id);

Правило:

При CCA fail система ставит: 

quality_hold='system',

hold_reason='CCA fail: ...',

hold_set_at=NOW(),

hold_set_by_user_id = текущий пользователь.

containers.status не меняется на “blocked” автоматически.
(Если вам нужен “blocked” как физически недоступный — оставляйте “blocked” только для QP/Admin или переименуйте в “discarded/quarantine”.)

**CR-003: Правила поведения процесса/шага при CCA ****fail**** (частичный ****fail****)**

**1) Требования к поведению**

Добавить в ТЗ раздел “Поведение при CCA fail”:

**CCA ****fail**** по одному контейнеру**:

создаётся/обновляется Deviation с container_id,

контейнер ставится в quality_hold='system',

остальные контейнеры могут продолжать выполнение шага/процесса,

у проблемного контейнера в executed_step_container_results.status='failed_cca'.

**CCA ****fail**** уровня ****process-critical** (если правило критично для всего процесса):

executed_process.status = 'paused_quality_hold',

дальнейшие шаги запрещены до решения QP.

**2) Где хранить “****process-critical****”**

В CCA rules (если у вас они есть как таблица/конфиг) добавить:

scope: 'container' | 'process'

или block_process_on_fail boolean.

**CR-004: ****Deviation**** должна быть идемпотентной и ссылаться на конкретный “****container**** ****result****”**

**1) Причина**

Иначе при повторном клике/повторной отправке создаются дубликаты deviation, а также сложно связать deviation с измерением.

**2) ****Изменения**

В deviations добавить ссылку на executed_step_container_results:

ALTER TABLE deviations

ADD COLUMN executed_step_container_result_id INTEGER 

REFERENCES executed_step_container_results(id);

И ввести уникальность для CCA отклонений:

CREATE UNIQUE INDEX uq_deviation_cca_once

ON deviations(deviation_type, executed_step_container_result_id)

WHERE deviation_type = 'cca_fail';

Идемпотентность на API-уровне (в ТЗ):

endpoint завершения шага принимает Idempotency-Key и не выполняет повторно.

**CR-005: UI-изменение для критических шагов — таблица по контейнерам + явный результат CCA**

**Экран Step 3 (пример формулировки для ТЗ)**

Вместо “одна форма шага”:

**Шаг 3/8: Подсчёт клеток (****Critical****, CCA)**

Таблица:

| Контейнер | Конц., cells/ml | Viability, % | CCA статус | Действие |
| --- | --- | --- | --- | --- |
| T75-042-P3-1 | [____] | [____] | ⏳/✅/❌ | [Сохранить] |
| T75-042-P3-2 | [____] | [____] | ⏳/✅/❌ | [Сохранить] |

Кнопки:

“Проверить CCA”

“Завершить шаг (для прошедших контейнеров)”

“Создать Deviation (авто при fail)”

Поведение:

CCA считается отдельно по каждой строке (контейнеру).

При fail строка подсвечивается, контейнер уходит в quality_hold=system, создаётся deviation, но шаг для остальных может завершаться.

**CR-006 (коротко): риск-****flag**** у культуры должен быть вычисляемым/по событиям, а не “тихо” ставиться**

Если в ТЗ есть cultures.risk_flag, уточнить правило:

risk_flag выставляется **событийно** (например, “есть открытые critical deviations”).

При закрытии deviation флаг либо снимается автоматически по правилу, либо требует подтверждения QP (в зависимости от политики).

Минимально: хранить risk_flag_reason как ссылку на deviation (например, risk_flag_reason='DEV-000123').

**Если хотите — сделаю “патч” к вашему DDL целиком**

Могу собрать:

полный SQL-миграционный скрипт (ALTER/CREATE INDEX),

обновлённые ER-диаграммы (Mermaid),

краткие Acceptance Criteria для QA (что считается правильным поведением на Step 3).

Скажите, вы хотите **минимальные изменения** (самые маленькие ALTER) или **нормальный рефакторинг** (версионирование SOP/CCA снапшоты тоже включить).
