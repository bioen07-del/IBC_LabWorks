import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Plus, Beaker, ChevronDown, ChevronRight } from 'lucide-react'

type MediaRecipe = Database['public']['Tables']['media_recipes']['Row']
type MediaRecipeComponent = Database['public']['Tables']['media_recipe_components']['Row']

const recipeTypeLabels: Record<string, string> = {
  base: 'Базовая среда',
  combined: 'Комбинированная'
}

export function MediaRecipesPage() {
  const [recipes, setRecipes] = useState<MediaRecipe[]>([])
  const [components, setComponents] = useState<Record<number, MediaRecipeComponent[]>>({})
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<MediaRecipe | null>(null)

  const [formData, setFormData] = useState({
    recipe_code: '',
    recipe_name: '',
    recipe_type: 'combined' as Database['public']['Enums']['media_recipe_type'],
    description: '',
    shelf_life_days: 14,
    storage_conditions: '+2...+8°C',
    preparation_sop_reference: ''
  })

  const componentTypes = [
    { value: 'base_medium', label: 'Базовая среда' },
    { value: 'serum', label: 'Сыворотка' },
    { value: 'antibiotic', label: 'Антибиотик' },
    { value: 'growth_factor', label: 'Фактор роста' },
    { value: 'supplement', label: 'Добавка' }
  ]

  const [componentsList, setComponentsList] = useState<{name: string, percentage: number, type: string}[]>([
    { name: '', percentage: 0, type: 'base_medium' }
  ])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: recipesData } = await supabase
      .from('media_recipes')
      .select('*')
      .order('recipe_name')
    setRecipes(recipesData || [])
    setLoading(false)
  }

  async function loadComponents(recipeId: number) {
    if (components[recipeId]) {
      setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId)
      return
    }
    const { data } = await supabase
      .from('media_recipe_components')
      .select('*')
      .eq('media_recipe_id', recipeId)
      .order('id')
    setComponents(prev => ({ ...prev, [recipeId]: data || [] }))
    setExpandedRecipe(recipeId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const payload = {
      ...formData,
      shelf_life_days: Number(formData.shelf_life_days)
    }

    let recipeId: number

    if (editingRecipe) {
      await supabase.from('media_recipes').update(payload).eq('id', editingRecipe.id)
      recipeId = editingRecipe.id
      // Delete existing components and re-add
      await supabase.from('media_recipe_components').delete().eq('media_recipe_id', recipeId)
    } else {
      const { data } = await supabase.from('media_recipes').insert(payload).select().single()
      if (!data) return
      recipeId = data.id
    }

    // Add components
    const validComponents = componentsList.filter(c => c.name && c.percentage > 0)
    if (validComponents.length > 0) {
      await supabase.from('media_recipe_components').insert(
        validComponents.map((c) => ({
          media_recipe_id: recipeId,
          component_name: c.name,
          component_type: c.type as any,
          quantity_percent: c.percentage,
          unit: '%'
        }))
      )
    }

    setShowModal(false)
    setEditingRecipe(null)
    resetForm()
    // Clear cached components
    setComponents(prev => {
      const newState = { ...prev }
      delete newState[recipeId]
      return newState
    })
    fetchData()
  }

  function resetForm() {
    setFormData({
      recipe_code: '',
      recipe_name: '',
      recipe_type: 'combined',
      description: '',
      shelf_life_days: 14,
      storage_conditions: '+2...+8°C',
      preparation_sop_reference: ''
    })
    setComponentsList([{ name: '', percentage: 0, type: 'base_medium' }])
  }

  async function openEdit(recipe: MediaRecipe) {
    // Load components first
    const { data: comps } = await supabase
      .from('media_recipe_components')
      .select('*')
      .eq('media_recipe_id', recipe.id)
      .order('id')
    
    setEditingRecipe(recipe)
    setFormData({
      recipe_code: recipe.recipe_code,
      recipe_name: recipe.recipe_name,
      recipe_type: recipe.recipe_type,
      description: recipe.description || '',
      shelf_life_days: recipe.shelf_life_days,
      storage_conditions: recipe.storage_conditions || '',
      preparation_sop_reference: recipe.preparation_sop_reference || ''
    })
    setComponentsList(
      comps && comps.length > 0
        ? comps.map(c => ({ name: c.component_name, percentage: c.quantity_percent || 0, type: c.component_type }))
        : [{ name: '', percentage: 0, type: 'base_medium' }]
    )
    setShowModal(true)
  }

  function addComponent() {
    setComponentsList([...componentsList, { name: '', percentage: 0, type: 'base_medium' }])
  }

  function removeComponent(idx: number) {
    setComponentsList(componentsList.filter((_, i) => i !== idx))
  }

  function updateComponent(idx: number, field: 'name' | 'percentage' | 'type', value: string | number) {
    const updated = [...componentsList]
    if (field === 'name') {
      updated[idx].name = value as string
    } else if (field === 'percentage') {
      updated[idx].percentage = value as number
    } else {
      updated[idx].type = value as string
    }
    setComponentsList(updated)
  }

  const totalPercentage = componentsList.reduce((sum, c) => sum + (c.percentage || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Рецепты сред</h1>
          <p className="text-slate-500">Управление рецептами приготовления комбинированных сред</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingRecipe(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Новый рецепт
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="space-y-4">
          {recipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => loadComponents(recipe.id)}
              >
                <div className="flex items-center gap-4">
                  <Beaker className="h-8 w-8 text-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500">{recipe.recipe_code}</span>
                      <h3 className="font-semibold text-slate-900">{recipe.recipe_name}</h3>
                    </div>
                    <div className="text-sm text-slate-500 flex gap-4">
                      <span>{recipeTypeLabels[recipe.recipe_type]}</span>
                      <span>Срок хранения: {recipe.shelf_life_days} дней</span>
                      {recipe.storage_conditions && <span>{recipe.storage_conditions}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(recipe) }}
                    className="text-emerald-600 hover:text-emerald-800 text-sm"
                  >
                    Редактировать
                  </button>
                  {expandedRecipe === recipe.id ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
              
              {expandedRecipe === recipe.id && components[recipe.id] && (
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Состав:</h4>
                  {components[recipe.id].length === 0 ? (
                    <p className="text-sm text-slate-500">Компоненты не указаны</p>
                  ) : (
                    <div className="space-y-2">
                      {components[recipe.id].map(comp => (
                        <div key={comp.id} className="flex items-center gap-4">
                          <div className="w-16 text-right font-mono text-sm text-emerald-600">
                            {comp.quantity_percent || 0}%
                          </div>
                          <div className="flex-1 bg-white px-3 py-2 rounded border border-slate-200 text-sm">
                            {comp.component_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {recipe.description && (
                    <p className="mt-4 text-sm text-slate-600">{recipe.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {recipes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Beaker className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Рецепты не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingRecipe ? 'Редактировать рецепт' : 'Новый рецепт'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код рецепта *</label>
                  <input
                    type="text"
                    required
                    value={formData.recipe_code}
                    onChange={(e) => setFormData({...formData, recipe_code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="RCP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select
                    value={formData.recipe_type}
                    onChange={(e) => setFormData({...formData, recipe_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="base">Базовая среда</option>
                    <option value="combined">Комбинированная</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  required
                  value={formData.recipe_name}
                  onChange={(e) => setFormData({...formData, recipe_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="DMEM + 10% FBS + P/S"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Срок хранения (дней)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({...formData, shelf_life_days: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Условия хранения</label>
                  <input
                    type="text"
                    value={formData.storage_conditions}
                    onChange={(e) => setFormData({...formData, storage_conditions: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="+2...+8°C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">СОП приготовления</label>
                  <input
                    type="text"
                    value={formData.preparation_sop_reference}
                    onChange={(e) => setFormData({...formData, preparation_sop_reference: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="SOP-MED-001"
                  />
                </div>
              </div>

              {/* Components */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Компоненты</label>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${totalPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Итого: {totalPercentage}%
                    </span>
                    <button
                      type="button"
                      onClick={addComponent}
                      className="text-sm text-emerald-600 hover:text-emerald-800"
                    >
                      + Добавить
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {componentsList.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={comp.percentage}
                        onChange={(e) => updateComponent(idx, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center"
                        placeholder="%"
                      />
                      <span className="text-slate-400">%</span>
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                        placeholder="Название компонента (напр. DMEM, FBS, Pen/Strep)"
                      />
                      {componentsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComponent(idx)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingRecipe(null) }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editingRecipe ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
