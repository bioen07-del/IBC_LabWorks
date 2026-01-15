# Анализ замечаний оператора процесса
## Дата анализа: 2026-01-15

---

## 1. Бизнес-логика цепочки процессов не отображается

### Проблема
В ходе исполнения шагов процесса не видно бизнес-логику цепочки:
- Донор → Культура → Культивирование → Мастер-банк → Выдача/Утилизация
- Рабочая культура → Рабочий банк

### Текущее состояние кода

#### ✅ ХОРОШО: Модель данных ПРАВИЛЬНАЯ
**Файл: `src/lib/database.types.ts`**

Связи в базе данных ЕСТЬ и КОРРЕКТНЫЕ:
```typescript
donors (id)
  ↓
donations (donor_id)
  ↓
cultures (donation_id)
  - culture_type: 'standard' | 'master_bank' | 'working_bank'
  - order_id: связь с заказами
  ↓
containers (culture_id)
  ↓
releases (container_ids)
  ↓
orders (id)
```

#### ❌ ПРОБЛЕМА: Отображение цепочки НЕ РЕАЛИЗОВАНО

**Файл: `src/pages/ProcessExecution.tsx`**

**Строки 134-179**: Процесс запускается, но НЕ отображает:
- Откуда взята культура (донор, донация)
- Какой тип культуры (standard/master_bank/working_bank)
- Связь с заказом (order_id)
- Целевое назначение (выдача/утилизация/банк)

```typescript
// Текущий код - только базовая информация
async function startProcess() {
  // ...
  const { data: process } = await supabase
    .from('executed_processes')
    .select('*, process_templates(name, template_code), cultures(culture_code), users(full_name)')
    // ❌ НЕ загружается: donations, donors, orders, culture_type
}
```

**Строки 594-633**: В модальном окне процесса показывается:
- Код процесса (process_code)
- Название шаблона
- ❌ НЕ ПОКАЗЫВАЕТСЯ: цепочка донор→культура→банк→выдача

#### 📋 Что нужно ДОБАВИТЬ

1. **В запросе процесса (строка 155)**:
```typescript
.select(`
  *,
  process_templates(name, template_code),
  cultures(
    culture_code,
    culture_type,
    donations(
      donation_code,
      donors(donor_code, full_name)
    ),
    orders(order_code, client_name)
  ),
  users(full_name)
`)
```

2. **В UI ProcessExecution (после строки 602)** добавить визуализацию цепочки:
```tsx
<div className="bg-slate-50 rounded-lg p-3 mt-3">
  <h4 className="text-xs font-semibold text-slate-600 mb-2">Цепочка прослеживаемости</h4>
  <div className="flex items-center gap-2 text-xs">
    {/* Донор */}
    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
      Донор: {culture.donations?.donors?.donor_code}
    </span>
    <span>→</span>
    {/* Донация */}
    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
      Донация: {culture.donations?.donation_code}
    </span>
    <span>→</span>
    {/* Культура */}
    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
      Культура: {culture.culture_code} ({culture.culture_type})
    </span>
    <span>→</span>
    {/* Назначение */}
    {culture.culture_type === 'master_bank' && (
      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded">
        Цель: Мастер-банк
      </span>
    )}
    {culture.culture_type === 'working_bank' && (
      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
        Цель: Рабочий банк
      </span>
    )}
    {culture.orders && (
      <>
        <span>→</span>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
          Заказ: {culture.orders.order_code}
        </span>
      </>
    )}
  </div>
</div>
```

---

## 2. Подсчет клеток не должен быть по контейнерам

### Проблема
Подсчет клеток и жизнеспособность делается только на **снятых с культуральной посуды клетках**, а это происходит только при:
- Снятии клеток (пассаже)
- Замораживании
- Размораживании

**НЕ при нахождении в контейнере!**

### Текущее состояние кода

#### ❌ ПРОБЛЕМА ОБНАРУЖЕНА

**Файл: `src/components/processes/step-forms/CellCountingForm.tsx`**

**Строки 58-66**: Загружаются ВСЕ АКТИВНЫЕ контейнеры культуры
```typescript
async function loadContainers() {
  const { data } = await supabase
    .from('containers')
    .select('id, container_code, volume_ml, cell_concentration, viability_percent')
    .eq('culture_id', cultureId)
    .eq('status', 'active')  // ❌ ОШИБКА: контейнеры могут быть активными БЕЗ снятия клеток
    .order('container_code')
}
```

**Проблема**: Система загружает контейнеры просто по статусу `active`, но **не проверяет**, были ли клетки СНЯТЫ с посуды.

#### 🔍 КОРРЕКТНАЯ логика

Подсчет клеток должен выполняться:

1. **При пассаже** - клетки снимаются с посуды трипсином/ферментами
2. **При замораживании** - клетки снимаются перед криоконсервацией
3. **При размораживании** - подсчет выполняется после оттаивания криовиала

**В этих случаях клетки находятся в СУСПЕНЗИИ** (взвеси), и только тогда можно:
- Взять аликвоту для подсчета
- Использовать гемоцитометр/автоматический счетчик
- Определить жизнеспособность красителем (трипановый синий)

#### 📋 Что нужно ИСПРАВИТЬ

**Вариант 1: Привязать к шагу процесса**

Форма `CellCountingForm` должна показывать только контейнеры, на которых **выполняется текущая операция**:

```typescript
// Вместо загрузки всех активных контейнеров
// Загружать только контейнеры из контекста выполняемого шага

type Props = {
  cultureId: number
  stepId: number
  operationType: 'passage' | 'freezing' | 'thawing'  // ✅ ДОБАВИТЬ
  selectedContainerIds?: number[]  // ✅ ДОБАВИТЬ - контейнеры, участвующие в операции
  onDataChange: (data: { ... }) => void
}

async function loadContainers() {
  // ✅ Если указаны конкретные контейнеры - загружаем только их
  if (selectedContainerIds && selectedContainerIds.length > 0) {
    const { data } = await supabase
      .from('containers')
      .select('id, container_code, volume_ml, cell_concentration, viability_percent')
      .in('id', selectedContainerIds)
      .order('container_code')
    setContainers(data || [])
  } else {
    // Если нет - загружаем активные (для обратной совместимости)
    // ... существующий код
  }
}
```

**Вариант 2: Связать с операциями в БД**

Добавить в таблицу `executed_steps` поле `affected_container_ids: JSON`:

```typescript
// При запуске шага "Подсчет клеток" сохранять, какие контейнеры участвуют
await supabase.from('executed_steps').update({
  affected_container_ids: [123, 456]  // ID контейнеров, на которых выполняется операция
})
```

Тогда форма загружает только эти контейнеры.

#### 🎯 РЕКОМЕНДАЦИЯ

Самое правильное решение:

1. **В процессе пассажа/заморозки/разморозки** сначала выбираются контейнеры
2. **Затем** открывается форма подсчета клеток для ЭТИХ контейнеров
3. **Подсчет клеток** не показывается для контейнеров, которые просто "сидят в инкубаторе"

**Пример последовательности** (ProcessExecution.tsx):
```
Шаг 1: Снятие клеток (Passage)
  ↓ выбор контейнеров: [C-001, C-002]
  ↓ трипсинизация
  ↓ центрифугирование
  ↓ ресуспендирование в среде
Шаг 2: Подсчет клеток
  ↓ форма CellCountingForm получает containerIds = [C-001, C-002]
  ↓ показывает ТОЛЬКО эти 2 контейнера для подсчета
```

---

## 3. Выбор множества контейнеров при посеве/пересеве

### Проблема
При посеве/пересеве клеток нужна возможность:
- Выбирать множество контейнеров
- Разные варианты контейнеров (типы)
- Подсчет плотности посева (в виде подсказки)
- Везде, где есть отсылка к контейнерам, их должно быть много и разных

### Текущее состояние кода

#### ✅ ЧАСТИЧНО РЕАЛИЗОВАНО

**Файл: `src/pages/CultureDetail.tsx`**

**Строки 112-163**: Есть система `containerGroups` для выбора множества типов контейнеров

```typescript
// ХОРОШО: Множественные группы контейнеров
const [containerGroups, setContainerGroups] = useState<{type_id: number | null; count: number}[]>([
  { type_id: null, count: 2 }
])

// ХОРОШО: Функции управления группами
const addContainerGroup = () => {
  setContainerGroups([...containerGroups, { type_id: null, count: 1 }])
}

const removeContainerGroup = (index: number) => {
  if (containerGroups.length > 1) {
    setContainerGroups(containerGroups.filter((_, i) => i !== index))
  }
}

const updateContainerGroup = (index: number, field: 'type_id' | 'count', value: any) => {
  const updated = [...containerGroups]
  updated[index] = { ...updated[index], [field]: value }
  setContainerGroups(updated)
}

// ХОРОШО: Подсчет общей площади
const getTotalArea = () => {
  return containerGroups.reduce((sum, g) => {
    const type = containerTypes.find(t => t.id === g.type_id) as any
    const area = type?.surface_area_cm2 || 0
    return sum + (area * g.count)
  }, 0)
}
```

#### ❌ ПРОБЛЕМЫ

**1. НЕ хватает подсказки по плотности посева**

Текущий код считает площадь (`getTotalArea`), но **НЕ показывает**:
- Рекомендуемую плотность посева (например, 5000 клеток/см²)
- Сколько всего клеток нужно для посева
- Какой объем клеточной суспензии взять

**2. UI для выбора контейнеров НЕ ВИДЕН в коде**

Функции есть (строки 138-163), но в предоставленном фрагменте кода **отсутствует JSX**, который отображает:
- Список групп контейнеров
- Кнопки добавления/удаления групп
- Dropdown для выбора типа контейнера
- Input для количества

**3. Нет интеграции с ProcessExecution**

В `ProcessExecution.tsx` **НЕТ** использования формы выбора множества контейнеров при пассаже.

#### 📋 Что нужно ДОБАВИТЬ

**1. В CultureDetail.tsx** (после строки 163, в JSX):

```tsx
{/* Выбор дочерних контейнеров */}
<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-medium text-slate-800">Дочерние контейнеры</h4>
    <button
      onClick={addContainerGroup}
      className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
    >
      + Добавить тип
    </button>
  </div>

  {containerGroups.map((group, idx) => (
    <div key={idx} className="flex items-center gap-3 mb-2">
      {/* Выбор типа контейнера */}
      <select
        value={group.type_id || ''}
        onChange={(e) => updateContainerGroup(idx, 'type_id', e.target.value ? parseInt(e.target.value) : null)}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
      >
        <option value="">Выберите тип</option>
        {containerTypes.map(t => (
          <option key={t.id} value={t.id}>
            {t.type_name} ({t.type_code}) - {t.surface_area_cm2} см²
          </option>
        ))}
      </select>

      {/* Количество */}
      <input
        type="number"
        min="1"
        value={group.count}
        onChange={(e) => updateContainerGroup(idx, 'count', parseInt(e.target.value) || 1)}
        className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
        placeholder="Кол-во"
      />

      {/* Удалить */}
      {containerGroups.length > 1 && (
        <button
          onClick={() => removeContainerGroup(idx)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ))}

  {/* Подсказка по плотности посева */}
  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
    <p className="text-xs text-blue-600 font-medium mb-1">Расчет посева</p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="text-blue-600">Всего контейнеров:</span>
        <span className="font-medium text-blue-800 ml-1">{getTotalChildCount()}</span>
      </div>
      <div>
        <span className="text-blue-600">Общая площадь:</span>
        <span className="font-medium text-blue-800 ml-1">{getTotalArea()} см²</span>
      </div>
      <div>
        <span className="text-blue-600">Плотность посева:</span>
        <span className="font-medium text-emerald-700 ml-1">5000 кл/см²</span>
      </div>
      <div>
        <span className="text-blue-600">Клеток требуется:</span>
        <span className="font-medium text-emerald-700 ml-1">
          {((getTotalArea() * 5000) / 1000000).toFixed(2)}M
        </span>
      </div>
    </div>
  </div>
</div>
```

**2. Создать отдельную форму PassageForm**

**Новый файл: `src/components/processes/step-forms/PassageForm.tsx`**

```typescript
type Props = {
  cultureId: number
  sourceContainerIds: number[]  // Родительские контейнеры
  onDataChange: (data: {
    containerGroups: {type_id: number; count: number}[]
    seedingDensity: number
    totalCellsRequired: number
  }) => void
}

export function PassageForm({ cultureId, sourceContainerIds, onDataChange }: Props) {
  const [containerTypes, setContainerTypes] = useState([])
  const [containerGroups, setContainerGroups] = useState([{ type_id: null, count: 1 }])
  const [seedingDensity, setSeedingDensity] = useState(5000) // клеток/см²

  // ... функции addGroup, removeGroup, updateGroup, getTotalArea

  const totalArea = getTotalArea()
  const totalCellsRequired = totalArea * seedingDensity

  useEffect(() => {
    onDataChange({ containerGroups, seedingDensity, totalCellsRequired })
  }, [containerGroups, seedingDensity])

  return (
    <div>
      {/* UI как выше */}
    </div>
  )
}
```

**3. Использовать в ProcessExecution.tsx**

```tsx
{stepType === 'passage' && (
  <PassageForm
    cultureId={selectedProcess.culture_id}
    sourceContainerIds={stepForm.recorded_parameters.source_containers || []}
    onDataChange={(data) => {
      setStepFormData(data)
      setStepForm(prev => ({
        ...prev,
        recorded_parameters: { ...prev.recorded_parameters, ...data }
      }))
    }}
  />
)}
```

---

## 4. Отчеты и дашборды не связаны с системой

### Проблема
Отчеты, дашборды и другие метрики как будто не связаны с системой, образцами, задачами и т.д.

### Текущее состояние кода

#### ✅ ЧАСТИЧНО СВЯЗАНЫ

**Файл: `src/pages/Dashboard.tsx`**

**Строки 80-107**: Метрики ЗАГРУЖАЮТСЯ из таблиц
```typescript
async function loadStats() {
  const [cultures, orders, deviations, tasks, donations, expiring] = await Promise.all([
    supabase.from('cultures').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'in_production'),
    supabase.from('deviations').select('id', { count: 'exact' }).eq('status', 'open'),
    supabase.from('tasks').select('id', { count: 'exact' }).eq('status', 'pending').lte('due_date', today),
    supabase.from('donations').select('id', { count: 'exact' }).eq('status', 'received'),
    supabase.from('inventory_items').select('id', { count: 'exact' }).eq('status', 'active').lte('expiry_date', weekFromNow)
  ])
  // ✅ ХОРОШО: Данные реально запрашиваются из БД
}
```

**Строки 109-129**: График статусов культур
```typescript
async function loadCultureStatusChart() {
  const { data } = await supabase.from('cultures').select('status')
  // ✅ ХОРОШО: Реальные данные, построение графика
}
```

**Строки 131-145**: Недельная активность
```typescript
async function loadWeeklyActivity() {
  const { data: history } = await supabase
    .from('culture_history')
    .select('action')
    .gte('performed_at', weekAgo)
    .in('action', ['Пассирование', 'Заморозка'])
  // ✅ ХОРОШО: Данные из истории культур
}
```

#### ❌ ПРОБЛЕМЫ

**1. Отсутствуют ссылки на детали**

Дашборд показывает:
- "3 открытых отклонения" - но **НЕТ кликабельной ссылки** на список отклонений
- "5 задач на сегодня" - нет перехода к задачам
- "2 истекающих товара" - нет перехода к инвентарю

**2. НЕ показывается контекст**

Например, для отклонения не видно:
- К какой культуре относится
- К какому процессу
- К какому образцу/контейнеру

**3. Метрики НЕ детализированы**

Нет drill-down возможности:
- Кликнуть на "Активные культуры" → увидеть список
- Кликнуть на "Заказы в производстве" → увидеть таблицу заказов

#### 📋 Что нужно ДОБАВИТЬ

**1. Кликабельные карточки метрик** (Dashboard.tsx, после строки 107):

```tsx
{/* Вместо простых карточек с цифрами */}
<Link to="/cultures?status=active">
  <div className="bg-white rounded-xl p-4 border hover:shadow-lg transition-shadow cursor-pointer">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">Активные культуры</p>
        <p className="text-3xl font-bold text-emerald-600">{stats.activeCultures}</p>
      </div>
      <FlaskConical className="h-10 w-10 text-emerald-500" />
    </div>
    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
      Перейти к списку <ArrowRight className="h-3 w-3" />
    </p>
  </div>
</Link>
```

**2. Детализация в списках** (Dashboard.tsx, строки 147+):

```typescript
async function loadRecentTasks() {
  const { data } = await supabase
    .from('tasks')
    .select(`
      id, task_code, title, priority, due_date, status,
      cultures(culture_code),
      deviations(deviation_code)
    `)
    .eq('status', 'pending')
    .order('due_date')
    .limit(5)
  setRecentTasks(data || [])
}
```

Затем в UI показывать связи:
```tsx
<div className="text-xs text-slate-500">
  {task.cultures && (
    <span className="mr-2">Культура: {task.cultures.culture_code}</span>
  )}
  {task.deviations && (
    <span>Отклонение: {task.deviations.deviation_code}</span>
  )}
</div>
```

**3. Отчеты с фильтрацией** (Reports.tsx):

Добавить связанные фильтры:
```tsx
<select onChange={(e) => setFilterCultureId(e.target.value)}>
  <option value="">Все культуры</option>
  {cultures.map(c => (
    <option key={c.id} value={c.id}>{c.culture_code}</option>
  ))}
</select>

// При генерации отчета
const { data } = await supabase
  .from('executed_processes')
  .select('*, cultures(culture_code), process_templates(name)')
  .eq(filterCultureId ? 'culture_id' : 'id', filterCultureId || 0) // Условная фильтрация
```

**4. Дашборд процессов**

Добавить новую секцию на дашборде (Dashboard.tsx):
```tsx
<div className="bg-white rounded-xl p-4 border">
  <h3 className="font-semibold mb-3">Активные процессы</h3>
  {activeProcesses.map(proc => (
    <Link
      key={proc.id}
      to={`/cultures/${proc.culture_id}`}
      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded"
    >
      <div>
        <p className="font-mono text-sm">{proc.process_code}</p>
        <p className="text-xs text-slate-500">
          {proc.process_templates.name} • {proc.cultures.culture_code}
        </p>
      </div>
      <span className="text-xs text-blue-600">
        Шаг {proc.current_step_number}/{proc.total_steps}
      </span>
    </Link>
  ))}
</div>
```

---

## Сводная таблица проблем и статусов

| # | Проблема | Файл | Строки | Статус | Критичность |
|---|----------|------|--------|--------|-------------|
| 1 | Не видно цепочку донор→культура→банк→выдача | ProcessExecution.tsx | 155, 594-633 | ❌ Не реализовано | 🔴 Высокая |
| 2 | Подсчет клеток по всем контейнерам, а не только снятым | CellCountingForm.tsx | 58-66 | ❌ Ошибка логики | 🔴 Критическая |
| 3 | Нет множественного выбора контейнеров с подсказкой плотности | CultureDetail.tsx | 112-163 | 🟡 Частично | 🟡 Средняя |
| 4 | Дашборды не кликабельны, нет drill-down | Dashboard.tsx | 80-150 | 🟡 Частично | 🟡 Средняя |

---

## Приоритеты исправления

### 🔴 Критично (сделать первым)
1. **Проблема #2**: Исправить логику подсчета клеток - это влияет на КАЧЕСТВО данных и безопасность процесса

### 🟠 Высокий приоритет (сделать вторым)
2. **Проблема #1**: Добавить отображение цепочки процессов - это основа прослеживаемости по GMP

### 🟡 Средний приоритет
3. **Проблема #3**: Улучшить UI выбора контейнеров
4. **Проблема #4**: Сделать дашборды интерактивными

---

## Рекомендации по реализации

1. **Для проблемы #2** (подсчет клеток):
   - Добавить в Props параметр `operationType` и `selectedContainerIds`
   - Изменить запрос `loadContainers()` для загрузки только выбранных контейнеров
   - Добавить валидацию: подсчет только при операциях passage/freezing/thawing

2. **Для проблемы #1** (цепочка):
   - Изменить запрос в `startProcess()` для загрузки связанных данных
   - Добавить компонент `<TraceabilityChain>` для визуализации
   - Показывать цепочку в хедере модального окна процесса

3. **Для проблемы #3** (контейнеры):
   - Создать отдельный компонент `<ContainerGroupSelector>`
   - Добавить калькулятор плотности посева
   - Интегрировать в форму пассажа

4. **Для проблемы #4** (дашборды):
   - Обернуть карточки метрик в `<Link>`
   - Добавить параметры URL для фильтрации (например, `/cultures?status=active`)
   - Добавить секцию "Активные процессы" на дашборд

---

**Дата составления**: 2026-01-15
**Анализ выполнил**: Claude Sonnet 4.5
**Репозиторий**: https://github.com/bioen07-del/IBC_LabWorks
