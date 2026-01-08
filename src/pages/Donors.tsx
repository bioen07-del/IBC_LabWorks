import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Tables } from '@/lib/supabase'
import { 
  Plus, 
  Search, 
  Users,
  ChevronRight,
  FileCheck
} from 'lucide-react'

type Donor = Tables<'donors'> & {
  donations: { id: number }[]
}

export function Donors() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDonors()
  }, [])

  async function loadDonors() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('donors')
        .select(`
          *,
          donations (id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDonors(data || [])
    } catch (error) {
      console.error('Error loading donors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Доноры</h1>
          <p className="text-slate-500 mt-1">Управление донорами биоматериала</p>
        </div>
        <Link
          to="/donors/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Добавить донора
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по коду донора..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Donors List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : donors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Доноры не найдены</p>
            <Link
              to="/donors/new"
              className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Добавить первого донора
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Код донора
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Год рождения
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Пол
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Группа крови
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Донаций
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Согласие
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {donors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link 
                      to={`/donors/${donor.id}`}
                      className="font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {donor.donor_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{donor.birth_year || '-'}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {donor.sex === 'male' ? 'М' : donor.sex === 'female' ? 'Ж' : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{donor.blood_type || '-'}</td>
                  <td className="px-6 py-4 text-slate-700">{donor.donations?.length || 0}</td>
                  <td className="px-6 py-4">
                    {donor.consent_form_url ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <FileCheck className="h-4 w-4" />
                        Есть
                      </span>
                    ) : (
                      <span className="text-slate-400">Нет</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/donors/${donor.id}`}>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
