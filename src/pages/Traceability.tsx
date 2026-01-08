import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ArrowRight, FlaskConical, User, Beaker, Package, Calendar } from 'lucide-react'

interface TraceNode {
  type: 'culture' | 'container' | 'donation' | 'donor' | 'media' | 'inventory'
  id: number
  code: string
  name: string
  date?: string
  status?: string
  children?: TraceNode[]
}

export function TraceabilityPage() {
  const [searchCode, setSearchCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [traceData, setTraceData] = useState<TraceNode | null>(null)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!searchCode.trim()) return
    
    setLoading(true)
    setError('')
    setTraceData(null)
    
    try {
      // Try to find by culture code
      const { data: culture } = await supabase
        .from('cultures')
        .select(`
          id, culture_code, cell_type, status, created_at,
          donations(id, donation_code, donation_date, tissue_type,
            donors(id, donor_code)
          ),
          containers(id, container_code, status, container_types(type_name))
        `)
        .eq('culture_code', searchCode.toUpperCase())
        .single()
      
      if (culture) {
        const donation = (culture as any).donations
        const donor = donation?.donors
        
        const node: TraceNode = {
          type: 'culture',
          id: culture.id,
          code: culture.culture_code,
          name: culture.cell_type || 'Культура',
          date: culture.created_at,
          status: culture.status,
          children: []
        }
        
        // Add donation
        if (donation) {
          const donationNode: TraceNode = {
            type: 'donation',
            id: donation.id,
            code: donation.donation_code,
            name: donation.tissue_type || 'Донация',
            date: donation.donation_date,
            children: []
          }
          
          // Add donor
          if (donor) {
            donationNode.children?.push({
              type: 'donor',
              id: donor.id,
              code: donor.donor_code,
              name: 'Донор'
            })
          }
          
          node.children?.push(donationNode)
        }
        
        // Add containers
        const containers = (culture as any).containers || []
        if (containers.length > 0) {
          for (const c of containers) {
            node.children?.push({
              type: 'container',
              id: c.id,
              code: c.container_code,
              name: c.container_types?.type_name || 'Контейнер',
              status: c.status
            })
          }
        }
        
        setTraceData(node)
        return
      }

      // Try container code
      const { data: container } = await supabase
        .from('containers')
        .select(`
          id, container_code, status, container_types(type_name),
          cultures(id, culture_code, cell_type,
            donations(id, donation_code,
              donors(id, donor_code)
            )
          )
        `)
        .eq('container_code', searchCode.toUpperCase())
        .single()
      
      if (container) {
        const culture = (container as any).cultures
        const donation = culture?.donations
        const donor = donation?.donors
        
        const node: TraceNode = {
          type: 'container',
          id: container.id,
          code: container.container_code,
          name: (container as any).container_types?.type_name || 'Контейнер',
          status: container.status,
          children: []
        }
        
        if (culture) {
          const cultureNode: TraceNode = {
            type: 'culture',
            id: culture.id,
            code: culture.culture_code,
            name: culture.cell_type,
            children: []
          }
          
          if (donation) {
            const donationNode: TraceNode = {
              type: 'donation',
              id: donation.id,
              code: donation.donation_code,
              name: 'Донация',
              children: donor ? [{
                type: 'donor',
                id: donor.id,
                code: donor.donor_code,
                name: 'Донор'
              }] : []
            }
            cultureNode.children?.push(donationNode)
          }
          
          node.children?.push(cultureNode)
        }
        
        setTraceData(node)
        return
      }

      setError('Объект не найден. Попробуйте код культуры или контейнера.')
      
    } catch (err) {
      console.error(err)
      setError('Ошибка при поиске')
    } finally {
      setLoading(false)
    }
  }

  const typeIcons: Record<string, any> = {
    culture: FlaskConical,
    container: Package,
    donation: Beaker,
    donor: User,
    media: Beaker,
    inventory: Package
  }

  const typeColors: Record<string, string> = {
    culture: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    container: 'bg-blue-100 text-blue-700 border-blue-300',
    donation: 'bg-purple-100 text-purple-700 border-purple-300',
    donor: 'bg-amber-100 text-amber-700 border-amber-300',
    media: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    inventory: 'bg-slate-100 text-slate-700 border-slate-300'
  }

  const typeLabels: Record<string, string> = {
    culture: 'Культура',
    container: 'Контейнер',
    donation: 'Донация',
    donor: 'Донор',
    media: 'Среда',
    inventory: 'Материал'
  }

  function renderNode(node: TraceNode, depth = 0) {
    const Icon = typeIcons[node.type] || Package
    
    return (
      <div key={`${node.type}-${node.id}`} className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
        <div className={`p-4 rounded-lg border-2 ${typeColors[node.type]}`}>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <div>
              <p className="text-xs font-medium uppercase">{typeLabels[node.type]}</p>
              <p className="font-bold">{node.code}</p>
              {node.name && <p className="text-sm">{node.name}</p>}
              {node.date && (
                <p className="text-xs flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(node.date).toLocaleDateString('ru-RU')}
                </p>
              )}
              {node.status && (
                <span className="text-xs px-2 py-0.5 bg-white/50 rounded mt-1 inline-block">
                  {node.status}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="border-l-2 border-slate-300 ml-4 pl-4 mt-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Прослеживаемость</h1>
        <p className="text-slate-500">Поиск полной цепочки происхождения материала</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex gap-4 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Введите код культуры или контейнера..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
        </div>
        
        {error && (
          <p className="mt-4 text-red-600 text-sm">{error}</p>
        )}
      </div>

      {/* Results */}
      {traceData && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Цепочка происхождения</h2>
          {renderNode(traceData)}
        </div>
      )}

      {!traceData && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Введите код для поиска цепочки прослеживаемости</p>
          <p className="text-sm text-slate-400 mt-2">Например: CUL-2026-001 или CNT-001</p>
        </div>
      )}
    </div>
  )
}
