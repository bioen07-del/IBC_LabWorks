import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { History, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface AuditEntry {
  id: number
  entity_type: string
  entity_id: number
  action_type: string
  changes: any
  comment: string | null
  user_id: number | null
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  users?: { full_name: string | null } | null
}

const actionLabels: Record<string, { label: string; color: string }> = {
  create: { label: 'Создание', color: 'bg-emerald-100 text-emerald-800' },
  update: { label: 'Изменение', color: 'bg-blue-100 text-blue-800' },
  delete: { label: 'Удаление', color: 'bg-red-100 text-red-800' },
  approve: { label: 'Одобрение', color: 'bg-purple-100 text-purple-800' },
  reject: { label: 'Отклонение', color: 'bg-red-100 text-red-800' },
  print: { label: 'Печать', color: 'bg-slate-100 text-slate-800' },
  export: { label: 'Экспорт', color: 'bg-slate-100 text-slate-800' },
}

const tableLabels: Record<string, string> = {
  cultures: 'Культуры',
  containers: 'Контейнеры',
  donors: 'Доноры',
  donations: 'Донации',
  orders: 'Заказы',
  deviations: 'Отклонения',
  inventory_items: 'Инвентарь',
  combined_media_batches: 'Партии сред',
  users: 'Пользователи',
  equipment: 'Оборудование',
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*, users(full_name)')
      .order('timestamp', { ascending: false })
      .limit(200)
    
    setEntries((data as AuditEntry[]) || [])
    setLoading(false)
  }

  const filteredEntries = entries.filter(e => {
    if (tableFilter && e.entity_type !== tableFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        e.entity_type.toLowerCase().includes(searchLower) ||
        String(e.entity_id).includes(searchLower) ||
        JSON.stringify(e.changes).toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const uniqueTables = [...new Set(entries.map(e => e.entity_type))]


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Журнал изменений</h1>
        <p className="text-slate-500">История всех изменений в системе</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg"
        >
          <option value="">Все таблицы</option>
          {uniqueTables.map(t => (
            <option key={t} value={t}>{tableLabels[t] || t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Дата/Время</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Таблица</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Действие</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Пользователь</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map(entry => {
                const isExpanded = expandedId === entry.id
                const changesData = entry.changes || {}
                
                return (
                  <>
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(entry.timestamp).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {tableLabels[entry.entity_type] || entry.entity_type}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{entry.entity_id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${actionLabels[entry.action_type]?.color || 'bg-slate-100'}`}>
                          {actionLabels[entry.action_type]?.label || entry.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {entry.users?.full_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${entry.id}-details`}>
                        <td colSpan={6} className="px-4 py-3 bg-slate-50">
                          <div className="text-sm">
                            <p className="font-medium mb-2">Детали ({entry.action_type}):</p>
                            {entry.comment && <p className="text-slate-600 mb-2">Комментарий: {entry.comment}</p>}
                            <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(changesData, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Записи не найдены</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
