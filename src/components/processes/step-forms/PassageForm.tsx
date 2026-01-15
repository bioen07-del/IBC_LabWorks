import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FlaskConical, Plus, X, Info, Calculator } from 'lucide-react'

type ContainerType = {
  id: number
  type_code: string
  type_name: string
  surface_area_cm2: number | null
}

type ContainerGroup = {
  type_id: number | null
  count: number
}

type Props = {
  cultureId: number
  sourceContainerIds?: number[]
  onDataChange: (data: {
    containerGroups: ContainerGroup[]
    seedingDensity: number
    totalCellsRequired: number
    totalArea: number
  }) => void
}

export function PassageForm({ cultureId, sourceContainerIds = [], onDataChange }: Props) {
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([])
  const [containerGroups, setContainerGroups] = useState<ContainerGroup[]>([
    { type_id: null, count: 1 }
  ])
  const [seedingDensity, setSeedingDensity] = useState(5000) // клеток/см²
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContainerTypes()
  }, [])

  useEffect(() => {
    // Уведомляем родителя об изменениях
    const totalArea = getTotalArea()
    const totalCellsRequired = totalArea * seedingDensity

    onDataChange({
      containerGroups,
      seedingDensity,
      totalCellsRequired,
      totalArea
    })
  }, [containerGroups, seedingDensity])

  async function loadContainerTypes() {
    const { data } = await supabase
      .from('container_types')
      .select('id, type_code, type_name, surface_area_cm2')
      .eq('is_active', true)
      .order('type_name')

    setContainerTypes(data || [])
    setLoading(false)
  }

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

  const getTotalChildCount = () => {
    return containerGroups.reduce((sum, g) => sum + g.count, 0)
  }

  const getTotalArea = () => {
    return containerGroups.reduce((sum, g) => {
      const type = containerTypes.find(t => t.id === g.type_id)
      const area = type?.surface_area_cm2 || 0
      return sum + (area * g.count)
    }, 0)
  }

  if (loading) {
    return <div className="text-center py-4 text-slate-500">Загрузка типов контейнеров...</div>
  }

  const totalArea = getTotalArea()
  const totalCellsRequired = totalArea * seedingDensity

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <FlaskConical className="h-5 w-5 text-blue-600" />
        Выбор дочерних контейнеров
      </div>

      {/* Информация об источнике */}
      {sourceContainerIds.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600">
            Исходные контейнеры: <span className="font-mono font-medium">{sourceContainerIds.length}</span>
          </p>
        </div>
      )}

      {/* Группы контейнеров */}
      <div className="space-y-2">
        {containerGroups.map((group, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <select
              value={group.type_id || ''}
              onChange={(e) => updateContainerGroup(idx, 'type_id', e.target.value ? parseInt(e.target.value) : null)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Выберите тип контейнера</option>
              {containerTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.type_name} ({t.type_code}) - {t.surface_area_cm2 || 0} см²
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={group.count}
              onChange={(e) => updateContainerGroup(idx, 'count', parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Кол-во"
            />

            {containerGroups.length > 1 && (
              <button
                onClick={() => removeContainerGroup(idx)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Удалить"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addContainerGroup}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Добавить тип контейнера
        </button>
      </div>

      {/* Плотность посева */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800 text-sm">Плотность посева</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1000"
            step="100"
            value={seedingDensity}
            onChange={(e) => setSeedingDensity(parseInt(e.target.value) || 5000)}
            className="w-32 px-3 py-2 border border-blue-300 rounded-lg text-sm"
          />
          <span className="text-sm text-blue-700">клеток/см²</span>
        </div>

        <p className="text-xs text-blue-600 mt-2">
          Рекомендуемая плотность для большинства типов клеток: 3000-10000 кл/см²
        </p>
      </div>

      {/* Расчеты */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-emerald-800 text-sm">Расчет посева</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-emerald-600 block mb-1">Всего контейнеров:</span>
            <span className="font-bold text-emerald-800 text-lg">{getTotalChildCount()}</span>
          </div>

          <div>
            <span className="text-emerald-600 block mb-1">Общая площадь:</span>
            <span className="font-bold text-emerald-800 text-lg">{totalArea.toFixed(1)} см²</span>
          </div>

          <div className="col-span-2">
            <span className="text-emerald-600 block mb-1">Клеток требуется всего:</span>
            <span className="font-bold text-emerald-800 text-2xl">
              {(totalCellsRequired / 1000000).toFixed(2)} × 10⁶
            </span>
            <span className="text-xs text-emerald-600 ml-2">
              ({totalCellsRequired.toLocaleString()} клеток)
            </span>
          </div>
        </div>

        {totalArea === 0 && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠️ Выберите хотя бы один тип контейнера для расчета
          </div>
        )}
      </div>
    </div>
  )
}
