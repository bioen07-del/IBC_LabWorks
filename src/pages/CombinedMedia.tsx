import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Plus, Beaker, AlertTriangle, QrCode, Star, ChevronRight, ChevronLeft, Package, Check, X } from 'lucide-react'
import { QRCodeModal } from '@/components/ui/QRCodeModal'

type CombinedMediaBatch = Database['public']['Tables']['combined_media_batches']['Row'] & {
  media_recipes?: { recipe_name: string; recipe_code: string } | null
  users?: { full_name: string | null } | null
  locations?: { location_name: string } | null
}

type MediaRecipe = Database['public']['Tables']['media_recipes']['Row']
type MediaRecipeComponent = Database['public']['Tables']['media_recipe_components']['Row']
type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type Location = Database['public']['Tables']['locations']['Row']

type SelectedComponent = {
  component: MediaRecipeComponent
  inventoryItem: InventoryItem | null
  quantityUsed: number
}

const statusLabels: Record<string, string> = {
  active: 'Активна',
  quarantined: 'Карантин',
  expired: 'Просрочена',
  depleted: 'Израсходована',
  disposed: 'Утилизирована'
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  quarantined: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
  depleted: 'bg-slate-100 text-slate-600',
  disposed: 'bg-slate-100 text-slate-600'
}

const sterilityLabels: Record<string, string> = {
  pending: 'Ожидание',
  passed: 'Пройден',
  failed: 'Не пройден'
}

const sterilityColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  passed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800'
}

export function CombinedMediaPage() {
  const [batches, setBatches] = useState<CombinedMediaBatch[]>([])
  const [recipes, setRecipes] = useState<MediaRecipe[]>([])
  const [recipeComponents, setRecipeComponents] = useState<MediaRecipeComponent[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qrModal, setQrModal] = useState<{ code: string; name: string } | null>(null)

  // Wizard state
  const [step, setStep] = useState(1)
  const [selectedRecipe, setSelectedRecipe] = useState<MediaRecipe | null>(null)
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([])
  const [formData, setFormData] = useState({
    volume_ml: 500,
    preparation_date: new Date().toISOString().split('T')[0],
    storage_location_id: null as number | null,
    notes: '',
    manual_expiry_days: null as number | null
  })

  // Calculate expiry based on selected components
  function getCalculatedExpiry(): { days: number | null; needsManual: boolean; minDate: string | null } {
    const selected = selectedComponents.filter(sc => sc.inventoryItem)
    if (selected.length === 0) return { days: null, needsManual: true, minDate: null }
    
    // Find min expiry date from selected inventory
    const expiryDates = selected.map(sc => new Date(sc.inventoryItem!.expiry_date))
    const minExpiry = new Date(Math.min(...expiryDates.map(d => d.getTime())))
    const prepDate = new Date(formData.preparation_date)
    const daysDiff = Math.ceil((minExpiry.getTime() - prepDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check storage conditions - for now assume same if all items exist
    // In real app, would check storage_condition field
    const needsManual = daysDiff <= 0
    
    return { 
      days: daysDiff > 0 ? daysDiff : null, 
      needsManual, 
      minDate: minExpiry.toISOString().split('T')[0] 
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: batchesData }, { data: recipesData }, { data: componentsData }, { data: inventoryData }, { data: locationsData }] = await Promise.all([
      supabase
        .from('combined_media_batches')
        .select('*, media_recipes(recipe_name, recipe_code), users(full_name), locations(location_name)')
        .order('expiry_date', { ascending: true }),
      supabase.from('media_recipes').select('*').eq('is_active', true).order('recipe_name'),
      supabase.from('media_recipe_components').select('*').order('id'),
      supabase.from('inventory_items').select('*').eq('status', 'active').gt('quantity_remaining', 0).order('expiry_date'),
      supabase.from('locations').select('*').eq('status', 'active')
    ])
    setBatches(batchesData || [])
    setRecipes(recipesData || [])
    setRecipeComponents(componentsData || [])
    setInventoryItems(inventoryData || [])
    setLocations(locationsData || [])
    setLoading(false)
  }

  function selectRecipe(recipe: MediaRecipe) {
    setSelectedRecipe(recipe)
    // Get components for this recipe
    const components = recipeComponents.filter(c => c.media_recipe_id === recipe.id)
    // Initialize selected components with null inventory and calculated quantity
    setSelectedComponents(components.map(c => ({
      component: c,
      inventoryItem: null,
      quantityUsed: c.quantity_per_liter ? (c.quantity_per_liter * formData.volume_ml / 1000) : (c.quantity_percent ? formData.volume_ml * c.quantity_percent / 100 : 0)
    })))
    setStep(2)
  }

  function selectInventoryForComponent(componentId: number, item: InventoryItem) {
    setSelectedComponents(prev => prev.map(sc => {
      if (sc.component.id !== componentId) return sc
      // Auto-calculate required quantity in ml
      let requiredMl = 0
      if (sc.component.quantity_per_liter) {
        requiredMl = sc.component.quantity_per_liter * formData.volume_ml / 1000
      } else if (sc.component.quantity_percent) {
        requiredMl = formData.volume_ml * sc.component.quantity_percent / 100
      }
      return { ...sc, inventoryItem: item, quantityUsed: Math.round(requiredMl * 100) / 100 }
    }))
  }

  function updateComponentQuantity(componentId: number, quantity: number) {
    setSelectedComponents(prev => prev.map(sc => 
      sc.component.id === componentId 
        ? { ...sc, quantityUsed: quantity }
        : sc
    ))
  }

  function normalizeForSearch(name: string): string {
    return name.toLowerCase()
      .replace(/[\-\/\s]+/g, '') // remove -, /, spaces
      .replace(/penicillinstreptomycin|penicillinstrep|penstrep/g, 'penstrep')
  }

  function getAvailableInventory(componentName: string): InventoryItem[] {
    const searchNorm = normalizeForSearch(componentName)
    return inventoryItems
      .filter(i => {
        const itemNorm = normalizeForSearch(i.item_name)
        return itemNorm.includes(searchNorm) || searchNorm.includes(itemNorm)
      })
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()) // FEFO
  }

  // Convert units: л->ml, мл->ml
  function convertToMl(qty: number, unit: string): number {
    const u = unit.toLowerCase()
    if (u === 'л' || u === 'l') return qty * 1000
    return qty // мл, ml
  }

  function getAvailableMl(item: InventoryItem): number {
    return convertToMl(item.quantity_remaining, item.unit)
  }

  function canProceedToStep3(): boolean {
    // All required components must have inventory selected
    return selectedComponents.every(sc => sc.component.is_optional || (sc.inventoryItem && sc.quantityUsed > 0))
  }

  async function handleSubmit() {
    if (!selectedRecipe) return
    setSaving(true)

    try {
      // Generate batch code
      const prepDate = new Date(formData.preparation_date)
      const expiryInfo = getCalculatedExpiry()
      const expiryDays = formData.manual_expiry_days || expiryInfo.days || selectedRecipe.shelf_life_days
      const expiryDate = new Date(prepDate)
      expiryDate.setDate(expiryDate.getDate() + expiryDays)

      const year = prepDate.getFullYear()
      const { count } = await supabase
        .from('combined_media_batches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)
      const batchNumber = String((count || 0) + 1).padStart(3, '0')
      const batchCode = `MED-${year}-${batchNumber}`

      // 1. Create batch
      const { data: batch, error: batchError } = await supabase
        .from('combined_media_batches')
        .insert({
          batch_code: batchCode,
          media_recipe_id: selectedRecipe.id,
          volume_ml: formData.volume_ml,
          volume_remaining_ml: formData.volume_ml,
          preparation_date: formData.preparation_date,
          expiry_date: expiryDate.toISOString().split('T')[0],
          storage_location_id: formData.storage_location_id,
          notes: formData.notes || null,
          status: 'active',
          sterility_status: 'pending'
        })
        .select()
        .single()

      if (batchError) throw batchError

      // 2. Create batch components & deduct from inventory
      for (const sc of selectedComponents) {
        if (!sc.inventoryItem || sc.quantityUsed <= 0) continue

        // Create media_component_batch if not exists, then link
        const { data: componentBatch, error: selectError } = await supabase
          .from('media_component_batches')
          .select('id')
          .eq('inventory_item_id', sc.inventoryItem.id)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Error selecting component batch:', selectError)
          throw new Error(`Ошибка поиска партии компонента: ${selectError.message}`)
        }

        let componentBatchId = componentBatch?.id

        if (!componentBatchId) {
          const { data: newBatch, error: insertBatchError } = await supabase
            .from('media_component_batches')
            .insert({
              inventory_item_id: sc.inventoryItem.id,
              component_name: sc.inventoryItem.item_name,
              batch_code: sc.inventoryItem.batch_code || sc.inventoryItem.lot_number || `CB-${sc.inventoryItem.id}`,
              lot_number: sc.inventoryItem.lot_number,
              quantity_remaining: sc.inventoryItem.quantity_remaining,
              unit: sc.inventoryItem.unit,
              expiry_date: sc.inventoryItem.expiry_date,
              status: 'active'
            })
            .select()
            .single()

          if (insertBatchError) {
            console.error('Error creating component batch:', insertBatchError)
            throw new Error(`Ошибка создания партии компонента: ${insertBatchError.message}`)
          }
          componentBatchId = newBatch?.id
        }

        if (componentBatchId) {
          // Link to batch
          const { error: linkError } = await supabase.from('combined_media_batch_components').insert({
            combined_media_batch_id: batch.id,
            media_component_batch_id: componentBatchId,
            quantity_used: sc.quantityUsed,
            unit: sc.inventoryItem.unit
          })

          if (linkError) {
            console.error('Error linking component to batch:', linkError)
            throw new Error(`Ошибка привязки компонента к партии: ${linkError.message}`)
          }
        }

        // Deduct from inventory
        const newRemaining = sc.inventoryItem.quantity_remaining - sc.quantityUsed
        const { error: updateInventoryError } = await supabase
          .from('inventory_items')
          .update({
            quantity_remaining: Math.max(0, newRemaining),
            status: newRemaining <= 0 ? 'depleted' : 'active'
          })
          .eq('id', sc.inventoryItem.id)

        if (updateInventoryError) {
          console.error('Error updating inventory:', updateInventoryError)
          throw new Error(`Ошибка обновления инвентаря: ${updateInventoryError.message}`)
        }

        // Create transaction
        const { error: transactionError } = await supabase.from('inventory_transactions').insert({
          inventory_item_id: sc.inventoryItem.id,
          transaction_type: 'usage',
          quantity: -sc.quantityUsed,
          unit: sc.inventoryItem.unit,
          combined_media_batch_id: batch.id,
          reason: `Приготовление среды ${batchCode}`
        })

        if (transactionError) {
          console.error('Error creating transaction:', transactionError)
          // Non-critical, just log
        }
      }

      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Ошибка при создании партии')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setStep(1)
    setSelectedRecipe(null)
    setSelectedComponents([])
    setFormData({
      volume_ml: 500,
      preparation_date: new Date().toISOString().split('T')[0],
      storage_location_id: null,
      notes: '',
      manual_expiry_days: null
    })
  }

  function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const activeBatches = batches.filter(b => b.status === 'active')
  const otherBatches = batches.filter(b => b.status !== 'active')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Комбинированные среды</h1>
          <p className="text-slate-500">Готовые партии сред для использования в процессах</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Приготовить партию
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <>
          {activeBatches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 border-b border-slate-200">
                <h2 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  Доступные партии (FEFO)
                </h2>
                <p className="text-sm text-emerald-600">Первым истекает — первым используется</p>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">FEFO</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Код партии</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Рецепт</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Объём</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Приготовлено</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Срок годности</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Стерильность</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Локация</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeBatches.map((batch, idx) => {
                    const daysUntilExpiry = getDaysUntilExpiry(batch.expiry_date)
                    const isFirst = idx === 0
                    return (
                      <tr key={batch.id} className={`hover:bg-slate-50 ${isFirst ? 'bg-emerald-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          {isFirst && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-xs font-medium">Первый</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{batch.batch_code}</span>
                            <button 
                              onClick={() => setQrModal({ code: batch.batch_code, name: batch.media_recipes?.recipe_name || '' })}
                              className="text-slate-400 hover:text-emerald-600"
                              title="Показать QR-код"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{batch.media_recipes?.recipe_name}</div>
                          <div className="text-xs text-slate-500">{batch.media_recipes?.recipe_code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {batch.volume_remaining_ml} / {batch.volume_ml} мл
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(batch.preparation_date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{new Date(batch.expiry_date).toLocaleDateString('ru-RU')}</span>
                            {daysUntilExpiry <= 7 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {daysUntilExpiry}д
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">({daysUntilExpiry}д)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${sterilityColors[batch.sterility_status]}`}>
                            {sterilityLabels[batch.sterility_status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {batch.locations?.location_name || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {otherBatches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-700">Архив</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Код партии</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Рецепт</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {otherBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm">{batch.batch_code}</td>
                      <td className="px-4 py-3 text-sm">{batch.media_recipes?.recipe_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[batch.status]}`}>
                          {statusLabels[batch.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(batch.preparation_date).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {batches.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Beaker className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Партии сред не найдены</p>
              <button
                onClick={() => { resetForm(); setShowModal(true) }}
                className="mt-4 text-emerald-600 hover:text-emerald-800"
              >
                Приготовить первую партию
              </button>
            </div>
          )}
        </>
      )}

      {/* Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header with steps */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Приготовление среды</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex text-xs text-slate-500 mt-2">
                <span className="flex-1">Рецепт</span>
                <span className="flex-1 text-center">Ингредиенты</span>
                <span className="flex-1 text-right">Подтверждение</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Select Recipe */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Объём (мл) *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.volume_ml}
                        onChange={(e) => setFormData({...formData, volume_ml: parseInt(e.target.value) || 500})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Дата приготовления</label>
                      <input
                        type="date"
                        value={formData.preparation_date}
                        onChange={(e) => setFormData({...formData, preparation_date: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <h3 className="font-medium text-slate-700">Выберите рецепт:</h3>
                  <div className="space-y-2">
                    {recipes.map(recipe => {
                      const componentCount = recipeComponents.filter(c => c.media_recipe_id === recipe.id).length
                      return (
                        <button
                          key={recipe.id}
                          onClick={() => selectRecipe(recipe)}
                          className="w-full p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{recipe.recipe_name}</p>
                              <p className="text-sm text-slate-500">{recipe.recipe_code} • {componentCount} компонентов • {recipe.shelf_life_days} дней хранения</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Select Ingredients */}
              {step === 2 && selectedRecipe && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-emerald-700">
                      <strong>{selectedRecipe.recipe_name}</strong> — выберите ингредиенты из инвентаря (FEFO)
                    </p>
                  </div>

                  {selectedComponents.map((sc) => {
                    const availableItems = getAvailableInventory(sc.component.component_name)
                    return (
                      <div key={sc.component.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {sc.component.component_name}
                              {sc.component.is_optional && <span className="text-slate-400 ml-2">(опционально)</span>}
                            </p>
                            <p className="text-sm text-slate-500">
                              {sc.component.component_type} • {sc.component.quantity_percent ? `${sc.component.quantity_percent}%` : `${sc.component.quantity_per_liter} ${sc.component.unit}/л`} → <span className="text-emerald-600 font-medium">нужно {sc.quantityUsed.toFixed(1)} мл</span>
                            </p>
                          </div>
                          {sc.inventoryItem && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
                              <Check className="h-3 w-3" /> Выбрано
                            </span>
                          )}
                        </div>

                        {sc.inventoryItem ? (
                          <>
                            {/* FEFO Warning if not first-expiring item */}
                            {availableItems.length > 0 && availableItems[0].id !== sc.inventoryItem.id && (
                              <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded text-sm text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  <strong>FEFO:</strong> Выбран не самый ранний по сроку. Рекомендуется: {availableItems[0].item_name} (до {new Date(availableItems[0].expiry_date).toLocaleDateString('ru')})
                                </span>
                              </div>
                            )}
                            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm text-emerald-800">{sc.inventoryItem.item_name}</p>
                                <p className="text-xs text-emerald-600">
                                  LOT: {sc.inventoryItem.lot_number} • До: {new Date(sc.inventoryItem.expiry_date).toLocaleDateString('ru')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-emerald-700">{sc.quantityUsed.toFixed(1)} мл</span>
                                <button
                                  onClick={() => selectInventoryForComponent(sc.component.id, null as any)}
                                  className="text-slate-400 hover:text-red-500"
                                  title="Выбрать другой"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            {availableItems.length > 0 ? (
                              availableItems.slice(0, 3).map((item, idx) => (
                                <button
                                  key={item.id}
                                  onClick={() => selectInventoryForComponent(sc.component.id, item)}
                                  className={`w-full p-2 border rounded text-left text-sm hover:border-emerald-500 transition-colors ${
                                    idx === 0 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">{item.item_name}</span>
                                      <span className="text-slate-500 ml-2">LOT: {item.lot_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {idx === 0 && <Star className="h-3 w-3 text-emerald-600 fill-current" />}
                                      <span>{getAvailableMl(item).toFixed(0)} мл</span>
                                      <span className="text-slate-400">до {new Date(item.expiry_date).toLocaleDateString('ru')}</span>
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                Нет доступных материалов в инвентаре
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && selectedRecipe && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Итого:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-slate-500">Рецепт:</p>
                      <p className="font-medium">{selectedRecipe.recipe_name}</p>
                      <p className="text-slate-500">Объём:</p>
                      <p className="font-medium">{formData.volume_ml} мл</p>
                      <p className="text-slate-500">Дата:</p>
                      <p className="font-medium">{new Date(formData.preparation_date).toLocaleDateString('ru')}</p>
                      <p className="text-slate-500">Срок годности:</p>
                      {(() => {
                        const info = getCalculatedExpiry()
                        if (formData.manual_expiry_days) {
                          return <p className="font-medium">{formData.manual_expiry_days} дней (установлено вручную)</p>
                        } else if (info.days && info.days > 0) {
                          return <p className="font-medium text-emerald-600">{info.days} дней (по мин. сроку компонента)</p>
                        } else {
                          return <p className="font-medium text-amber-600">Укажите ниже</p>
                        }
                      })()}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Используемые ингредиенты:</h4>
                    <div className="space-y-2">
                      {selectedComponents.filter(sc => sc.inventoryItem).map(sc => (
                        <div key={sc.component.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded text-sm">
                          <div>
                            <span className="font-medium">{sc.component.component_name}</span>
                            <span className="text-slate-500 ml-2">← {sc.inventoryItem!.item_name} (LOT: {sc.inventoryItem!.lot_number})</span>
                          </div>
                          <span className="text-emerald-700 font-medium">-{sc.quantityUsed} {sc.inventoryItem!.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const info = getCalculatedExpiry()
                    const showManual = info.needsManual || !info.days || info.days <= 0
                    if (showManual) return (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <label className="block text-sm font-medium text-amber-800 mb-1">Срок годности (дней) *</label>
                        <p className="text-xs text-amber-600 mb-2">Компоненты с разными условиями хранения. Укажите срок вручную.</p>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.manual_expiry_days || ''}
                          onChange={(e) => setFormData({...formData, manual_expiry_days: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                          placeholder="Например: 14"
                        />
                      </div>
                    )
                    return null
                  })()}

                  <div>
                    <label className="block text-sm font-medium mb-1">Место хранения</label>
                    <select
                      value={formData.storage_location_id || ''}
                      onChange={(e) => setFormData({...formData, storage_location_id: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Не указано</option>
                      {locations.filter(l => ['refrigerator', 'freezer'].includes(l.location_type)).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Примечания</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => step > 1 ? setStep(step - 1) : setShowModal(false)}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? 'Отмена' : 'Назад'}
              </button>

              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Далее
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Package className="h-4 w-4" />
                  {saving ? 'Создание...' : 'Создать партию'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrModal}
        onClose={() => setQrModal(null)}
        code={qrModal?.code || ''}
        title="QR-код партии среды"
        subtitle={qrModal?.name}
      />
    </div>
  )
}
