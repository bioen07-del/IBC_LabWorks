import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, FileText, Calendar, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react'

interface SOP {
  id: number;
  sop_code: string;
  title: string;
  description: string | null;
  version: string;
  is_active: boolean;
  effective_date: string | null;
  review_date: string | null;
  document_url: string | null;
}

export function SOPsPage() {
  const [sops, setSOPs] = useState<SOP[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    sop_code: '',
    title: '',
    description: '',
    version: '1.0',
    effective_date: '',
    review_date: '',
    document_url: ''
  })

  useEffect(() => {
    loadSOPs()
  }, [])

  async function loadSOPs() {
    const { data } = await supabase.from('sops').select('*').order('sop_code')
    setSOPs((data || []) as SOP[])
    setLoading(false)
  }

  const generateCode = () => `SOP-${Date.now().toString(36).toUpperCase()}`

  const handleCreate = async () => {
    await supabase.from('sops').insert({
      sop_code: formData.sop_code || generateCode(),
      title: formData.title,
      description: formData.description || null,
      version: formData.version || '1.0',
      effective_date: formData.effective_date || null,
      review_date: formData.review_date || null,
      document_url: formData.document_url || null,
      is_active: true
    })
    setShowModal(false)
    setFormData({ sop_code: '', title: '', description: '', version: '1.0', effective_date: '', review_date: '', document_url: '' })
    loadSOPs()
  }

  const filteredSOPs = sops.filter(sop =>
    sop.title.toLowerCase().includes(search.toLowerCase()) ||
    sop.sop_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">СОПы</h1>
          <p className="text-slate-500 mt-1">Стандартные операционные процедуры</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить СОП
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск СОПов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSOPs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">СОПы не найдены</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSOPs.map(sop => (
              <div key={sop.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500">{sop.sop_code}</span>
                      <span className="text-sm text-slate-400">v{sop.version}</span>
                      {sop.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                          <CheckCircle className="h-3 w-3" /> Активен
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          <XCircle className="h-3 w-3" /> Неактивен
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-slate-900 mt-1">{sop.title}</h3>
                    
                    {sop.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{sop.description}</p>}
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      {sop.effective_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Введён: {new Date(sop.effective_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {sop.review_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Пересмотр: {new Date(sop.review_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>

                  {sop.document_url && (
                    <a href={sop.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
                      <ExternalLink className="h-4 w-4" />
                      Открыть
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Новый СОП</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <input type="text" value={formData.sop_code} onChange={e => setFormData({...formData, sop_code: e.target.value})} placeholder="Авто" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Версия</label>
                  <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Дата введения</label>
                  <input type="date" value={formData.effective_date} onChange={e => setFormData({...formData, effective_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата пересмотра</label>
                  <input type="date" value={formData.review_date} onChange={e => setFormData({...formData, review_date: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL документа</label>
                  <input type="url" value={formData.document_url} onChange={e => setFormData({...formData, document_url: e.target.value})} placeholder="https://..." className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleCreate} disabled={!formData.title} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
