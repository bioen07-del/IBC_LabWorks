import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Snowflake, ChevronRight, ChevronLeft, Check, AlertTriangle, Calculator, Package, QrCode } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type Container = {
  id: number
  container_code: string
  status: string
  cell_count: number | null
  volume_ml: number | null
}

type ContainerType = {
  id: number
  type_code: string
  type_name: string
  category: string
  volume_ml: number | null
  suitable_for_ln2: boolean
  suitable_for_vapor: boolean
  suitable_for_minus80: boolean
  material: string | null
  manufacturer: string | null
}

type Location = {
  id: number
  location_code: string
  location_name: string
  location_type: string
}

type Props = {
  cultureId: number
  cultureName: string
  passageNumber: number
  totalFreezings: number
  onClose: () => void
}

export function BankingFormModal({ cultureId, cultureName, passageNumber, totalFreezings, onClose }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data
  const [containers, setContainers] = useState<Container[]>([])
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  // Step 1: Bank type selection
  const [bankType, setBankType] = useState<'mcb' | 'wcb'>('wcb')

  // Step 2: Container selection and cell counting
  const [selectedContainers, setSelectedContainers] = useState<number[]>([])
  const [totalCells, setTotalCells] = useState<number>(0)
  const [cellsPerMl, setCellsPerMl] = useState<number>(0)
  const [viability, setViability] = useState<number>(95)
  const [totalVolume, setTotalVolume] = useState<number>(0)

  // Step 3: Vial configuration
  const [containerTypeId, setContainerTypeId] = useState<number | null>(null)
  const [vialCount, setVialCount] = useState<number>(10)
  const [cellsPerVial, setCellsPerVial] = useState<number>(0)
  const [volumePerVial, setVolumePerVial] = useState<number>(1.0)

  // Step 4: Freezing parameters
  const [cryoMedia, setCryoMedia] = useState('DMSO 10%')
  const [freezingMethod, setFreezingMethod] = useState<'programmed' | 'manual' | 'direct_ln2'>('programmed')
  const [freezingRate, setFreezingRate] = useState('-1°C/min')
  const [storageTemp, setStorageTemp] = useState('-196°C (LN2)')
  const [locationId, setLocationId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [cultureId])

  useEffect(() => {
    // Auto-calculate cells per vial when total cells or vial count changes
    if (totalCells > 0 && vialCount > 0) {
      const calculated = totalCells / vialCount
      setCellsPerVial(Math.round(calculated))
    }
  }, [totalCells, vialCount])

  useEffect(() => {
    // Calculate cells/ml
    if (totalCells > 0 && totalVolume > 0) {
      setCellsPerMl(Math.round(totalCells / totalVolume))
    }
  }, [totalCells, totalVolume])

  async function loadData() {
    setLoading(true)

    const [containersRes, containerTypesRes, locationsRes] = await Promise.all([
      supabase
        .from('containers')
        .select('id, container_code, status, cell_count, volume_ml')
        .eq('culture_id', cultureId)
        .eq('status', 'active'),
      supabase
        .from('container_types')
        .select('*')
        .eq('category', 'cryovial')
        .eq('is_active', true)
        .order('type_name'),
      supabase
        .from('locations')
        .select('id, location_code, location_name, location_type')
        .in('location_type', ['freezer', 'ln2_storage', 'cryo_storage'])
        .eq('status', 'active')
        .order('location_name')
    ])

    setContainers(containersRes.data || [])
    setContainerTypes(containerTypesRes.data || [])
    setLocations(locationsRes.data || [])
    setLoading(false)
  }

  function toggleContainer(id: number) {
    const container = containers.find(c => c.id === id)
    if (!container) return

    const isSelected = selectedContainers.includes(id)

    if (isSelected) {
      setSelectedContainers(selectedContainers.filter(c => c !== id))
      setTotalCells(prev => prev - (container.cell_count || 0))
      setTotalVolume(prev => prev - (container.volume_ml || 0))
    } else {
      setSelectedContainers([...selectedContainers, id])
      setTotalCells(prev => prev + (container.cell_count || 0))
      setTotalVolume(prev => prev + (container.volume_ml || 0))
    }
  }

  function canProceedStep2(): boolean {
    return selectedContainers.length > 0 && totalCells > 0
  }

  function canProceedStep3(): boolean {
    return containerTypeId !== null && vialCount > 0 && cellsPerVial > 0
  }

  function canProceedStep4(): boolean {
    return locationId !== null && freezingMethod !== null
  }

  async function handleSubmit() {
    if (!user) return

    setSaving(true)

    try {
      const containerType = containerTypes.find(v => v.id === containerTypeId)
      if (!containerType) throw new Error('Container type not found')

      // Generate vial codes
      const timestamp = Date.now().toString(36).toUpperCase()
      const vialsToCreate = []

      for (let i = 1; i <= vialCount; i++) {
        const vialCode = `${bankType.toUpperCase()}-${cultureId}-P${passageNumber}-${timestamp}-${String(i).padStart(3, '0')}`

        vialsToCreate.push({
          vial_code: vialCode,
          culture_id: cultureId,
          bank_type: bankType,
          container_type_id: containerTypeId,
          passage_number: passageNumber,
          cells_per_vial: cellsPerVial,
          cells_per_ml: cellsPerMl,
          volume_ml: volumePerVial,
          cryopreservation_media: cryoMedia,
          freezing_method: freezingMethod,
          freezing_rate: freezingRate,
          storage_temperature: storageTemp,
          storage_location_id: locationId,
          freezing_date: new Date().toISOString().split('T')[0],
          frozen_by_user_id: user.id,
          status: 'frozen',
          qc_status: 'pending',
          notes: notes || null
        })
      }

      // Insert frozen vials
      const { error: vialsError } = await supabase
        .from('frozen_vials')
        .insert(vialsToCreate)

      if (vialsError) throw vialsError

      // Update container status to 'harvested'
      const { error: containersError } = await supabase
        .from('containers')
        .update({ status: 'harvested' })
        .in('id', selectedContainers)

      if (containersError) throw containersError

      // Списание виал из инвентаря
      const { data: inventoryItem, error: inventoryFetchError } = await supabase
        .from('inventory_items')
        .select('id, quantity_remaining, unit, item_name')
        .eq('container_type_id', containerTypeId)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true })
        .limit(1)
        .single()

      if (!inventoryFetchError && inventoryItem) {
        // Проверка достаточности
        if (inventoryItem.quantity_remaining < vialCount) {
          console.warn(
            `⚠️ Недостаточно виал в инвентаре!\n` +
            `Требуется: ${vialCount} ${inventoryItem.unit}\n` +
            `Доступно: ${inventoryItem.quantity_remaining} ${inventoryItem.unit}`
          )
        } else {
          // Списать виалы
          const newRemaining = inventoryItem.quantity_remaining - vialCount

          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              quantity_remaining: newRemaining,
              status: newRemaining <= 0 ? 'depleted' : 'active'
            })
            .eq('id', inventoryItem.id)

          if (updateError) {
            console.error('Ошибка обновления инвентаря:', updateError)
          } else {
            // Создать запись транзакции
            const { error: transactionError } = await supabase
              .from('inventory_transactions')
              .insert({
                inventory_item_id: inventoryItem.id,
                transaction_type: 'usage',
                quantity: vialCount,
                unit: inventoryItem.unit,
                performed_by_user_id: user.id,
                reason: `Криоконсервация ${bankType.toUpperCase()}: ${vialCount} виал для ${cultureName} (P${passageNumber})`,
                timestamp: new Date().toISOString()
              })

            if (transactionError) {
              console.error('Ошибка создания транзакции:', transactionError)
            }
          }
        }
      }

      // Record in culture history
      const { error: historyError } = await supabase
        .from('culture_history')
        .insert({
          culture_id: cultureId,
          event_type: 'banking',
          description: `Создан ${bankType === 'mcb' ? 'мастер-банк' : 'рабочий банк'}: ${vialCount} виал`,
          details: {
            bank_type: bankType,
            vial_count: vialCount,
            cells_per_vial: cellsPerVial,
            passage_number: passageNumber,
            containers: selectedContainers,
            container_type: containerType.type_name
          },
          performed_by_user_id: user.id
        })

      if (historyError) console.error('History error:', historyError)

      alert(`✅ Успешно создано ${vialCount} виал ${bankType.toUpperCase()}`)
      onClose()

    } catch (error: any) {
      console.error('Banking error:', error)
      alert(`Ошибка при создании банка: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const selectedContainerType = containerTypes.find(v => v.id === containerTypeId)

  // Check if MCB is allowed (only for primary cultures with no freezings)
  const mcbAllowed = totalFreezings === 0

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <span>Загрузка...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Snowflake className="h-6 w-6 text-cyan-600" />
                Криоконсервация клеток
              </h2>
              <p className="text-sm text-slate-600 mt-1">{cultureName} • Пассаж {passageNumber}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-full h-2 rounded-full ${step >= s ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                {s < 4 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
              </div>
            ))}
          </div>
          <div className="flex text-xs text-slate-500 mt-2 justify-between">
            <span>Тип банка</span>
            <span>Снятие клеток</span>
            <span>Виалы</span>
            <span>Заморозка</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Bank Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Выберите тип банка</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBankType('mcb')}
                    disabled={!mcbAllowed}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      bankType === 'mcb'
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-cyan-300'
                    } ${!mcbAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-xl font-bold text-cyan-700">MCB</div>
                    <div className="text-sm text-slate-600 mt-1">Master Cell Bank</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Мастер-банк • Только для первичных культур
                    </div>
                    {!mcbAllowed && (
                      <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Недоступно: культура уже замораживалась
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setBankType('wcb')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      bankType === 'wcb'
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="text-xl font-bold text-cyan-700">WCB</div>
                    <div className="text-sm text-slate-600 mt-1">Working Cell Bank</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Рабочий банк • Для рутинной работы
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Обратите внимание:</strong> MCB создается только из первичных культур
                  (ещё ни разу не замороженных). WCB можно создавать из любых культур.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Container Selection & Cell Counting */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Снятие клеток с культуральной посуды</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Выберите контейнеры для снятия клеток и укажите подсчёт
                </p>

                {containers.length === 0 ? (
                  <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    Нет активных контейнеров для снятия клеток
                  </div>
                ) : (
                  <div className="space-y-3">
                    {containers.map(c => (
                      <label
                        key={c.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedContainers.includes(c.id)
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-slate-200 hover:border-cyan-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedContainers.includes(c.id)}
                          onChange={() => toggleContainer(c.id)}
                          className="w-5 h-5 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-mono font-medium">{c.container_code}</div>
                          <div className="text-sm text-slate-500 mt-1 flex gap-4">
                            <span>Клеток: {c.cell_count?.toLocaleString() || 'не указано'}</span>
                            <span>Объём: {c.volume_ml || 'не указано'} мл</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Calculator className="h-5 w-5 text-cyan-600" />
                  Подсчёт клеток
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Общее количество клеток</label>
                    <input
                      type="number"
                      value={totalCells}
                      onChange={e => setTotalCells(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="1000000"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {totalCells.toLocaleString()} клеток
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Общий объём (мл)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={totalVolume}
                      onChange={e => setTotalVolume(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Жизнеспособность (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={viability}
                      onChange={e => setViability(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-3">
                    <div className="text-xs text-slate-600">Клеток/мл</div>
                    <div className="text-2xl font-bold text-cyan-700">
                      {cellsPerMl.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vial Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Конфигурация виал</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Тип криовиалы *</label>
                  <select
                    value={containerTypeId || ''}
                    onChange={e => setContainerTypeId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Выберите тип криовиалы</option>
                    {containerTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>
                        {ct.type_name} ({ct.volume_ml} мл)
                        {storageTemp.includes('LN2') && !ct.suitable_for_ln2 && ' ⚠️ Не для LN2'}
                        {ct.manufacturer && ` - ${ct.manufacturer}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Количество виал *</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={vialCount}
                      onChange={e => setVialCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Объём на виалу (мл)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={volumePerVial}
                      onChange={e => setVolumePerVial(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-3">
                    <div className="text-xs text-slate-600">Клеток на виалу</div>
                    <div className="text-xl font-bold text-cyan-700">
                      {cellsPerVial.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Расчёт доз</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Всего клеток:</span>
                    <span className="font-bold ml-2">{totalCells.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Клеток на дозу:</span>
                    <span className="font-bold ml-2">{cellsPerVial.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Количество доз:</span>
                    <span className="font-bold ml-2">{vialCount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Жизнеспособность:</span>
                    <span className="font-bold ml-2">{viability}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Freezing Parameters */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Параметры заморозки</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Криосреда</label>
                    <select
                      value={cryoMedia}
                      onChange={e => setCryoMedia(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>DMSO 10%</option>
                      <option>DMSO 5%</option>
                      <option>Glycerol 10%</option>
                      <option>CryoStor CS10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Метод заморозки *</label>
                    <select
                      value={freezingMethod}
                      onChange={e => setFreezingMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="programmed">Программный (контроллер скорости)</option>
                      <option value="manual">Ручной (изопропанол)</option>
                      <option value="direct_ln2">Прямо в LN2 (быстрая)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Скорость заморозки</label>
                    <select
                      value={freezingRate}
                      onChange={e => setFreezingRate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>-1°C/min</option>
                      <option>-0.5°C/min</option>
                      <option>-2°C/min</option>
                      <option>Быстрая (прямо в LN2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Температура хранения</label>
                    <select
                      value={storageTemp}
                      onChange={e => setStorageTemp(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>-196°C (LN2)</option>
                      <option>-150°C (LN2 vapor)</option>
                      <option>-80°C (ULT freezer)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Место хранения *</label>
                <select
                  value={locationId || ''}
                  onChange={e => setLocationId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Выберите криохранилище</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.location_code} - {loc.location_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Примечания</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Дополнительная информация о процессе заморозки..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-lg p-6">
                <h4 className="font-semibold text-cyan-900 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Итоговая информация
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Тип банка:</span>
                    <span className="font-bold ml-2">{bankType === 'mcb' ? 'MCB (Мастер-банк)' : 'WCB (Рабочий банк)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Пассаж:</span>
                    <span className="font-bold ml-2">P{passageNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Количество виал:</span>
                    <span className="font-bold ml-2">{vialCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Тип криовиалы:</span>
                    <span className="font-bold ml-2">{selectedContainerType?.type_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Клеток на виалу:</span>
                    <span className="font-bold ml-2">{cellsPerVial.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Метод заморозки:</span>
                    <span className="font-bold ml-2">
                      {freezingMethod === 'programmed' ? 'Программный' : freezingMethod === 'manual' ? 'Ручной' : 'Быстрая'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Отмена' : 'Назад'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 2 && !canProceedStep2()) ||
                (step === 3 && !canProceedStep3())
              }
              className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceedStep4() || saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Snowflake className="h-4 w-4" />
                  Создать {vialCount} виал
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
