import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/hooks/useAuth';
import { FlaskConical, Plus, Search, X, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface QCTest {
  id: number;
  test_code: string;
  culture_id: number | null;
  container_id: number | null;
  test_type: string;
  test_method: string | null;
  requested_at: string;
  performed_at: string | null;
  result_status: string | null;
  result_value: string | null;
  result_notes: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  inconclusive: 'bg-gray-100 text-gray-800'
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  pass: 'Пройден',
  fail: 'Не пройден',
  inconclusive: 'Неопределённо'
};

export default function QCTests() {
  const [tests, setTests] = useState<QCTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<QCTest | null>(null);
  const [formData, setFormData] = useState({
    test_type: 'sterility',
    test_method: '',
    culture_id: '',
    result_status: 'pass',
    result_value: '',
    result_notes: ''
  });

  useEffect(() => {
    fetchTests();
  }, [statusFilter]);

  const fetchTests = async () => {
    setLoading(true);
    let query = supabase
      .from('qc_tests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('result_status', statusFilter as any);
    }

    const { data } = await query;
    setTests(data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const d = new Date();
    return `QC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
  };

  const handleCreate = async () => {
    await (supabase.from('qc_tests') as any).insert({
      test_code: generateCode(),
      test_type: formData.test_type,
      test_method: formData.test_method,
      culture_id: formData.culture_id ? parseInt(formData.culture_id) : null,
      requested_by_user_id: getCurrentUserId(),
      result_status: 'pending'
    });
    setShowCreateModal(false);
    setFormData({ test_type: 'sterility', test_method: '', culture_id: '', result_status: 'pass', result_value: '', result_notes: '' });
    fetchTests();
  };

  const handleRecordResult = async () => {
    if (!selectedTest) return;
    await supabase.from('qc_tests').update({
      result_status: formData.result_status as any,
      result_value: formData.result_value,
      result_notes: formData.result_notes,
      performed_at: new Date().toISOString(),
      performed_by_user_id: 1
    }).eq('id', selectedTest.id);
    setShowResultModal(false);
    setSelectedTest(null);
    fetchTests();
  };

  const filtered = tests.filter(t =>
    t.test_code.toLowerCase().includes(search.toLowerCase()) ||
    t.test_type.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: tests.filter(t => t.result_status === 'pending').length,
    inProgress: tests.filter(t => t.result_status === 'in_progress').length,
    pass: tests.filter(t => t.result_status === 'pass').length,
    fail: tests.filter(t => t.result_status === 'fail').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-purple-500" />
            QC Тесты
          </h1>
          <p className="text-slate-500">Контроль качества культур и материалов</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus className="h-4 w-4" /> Создать тест
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ожидают', value: stats.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'В работе', value: stats.inProgress, icon: FileText, color: 'text-blue-600' },
          { label: 'Пройдено', value: stats.pass, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Не пройдено', value: stats.fail, icon: XCircle, color: 'text-red-600' }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 ${s.color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
          <option value="all">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="in_progress">В работе</option>
          <option value="pass">Пройдено</option>
          <option value="fail">Не пройдено</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">Тесты не найдены</div>
        ) : filtered.map(test => (
          <div key={test.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold">{test.test_code}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">{test.test_type}</span>
                  {test.result_status && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[test.result_status] || 'bg-slate-100'}`}>
                      {statusLabels[test.result_status] || test.result_status}
                    </span>
                  )}
                </div>
                {test.test_method && <p className="text-sm text-slate-600">Метод: {test.test_method}</p>}
                {test.result_value && <p className="text-sm"><strong>Результат:</strong> {test.result_value}</p>}
                <p className="text-xs text-slate-400">
                  Запрошен: {new Date(test.requested_at).toLocaleString('ru-RU')}
                  {test.performed_at && ` | Выполнен: ${new Date(test.performed_at).toLocaleString('ru-RU')}`}
                </p>
              </div>
              {test.result_status === 'pending' || test.result_status === 'in_progress' ? (
                <button onClick={() => { setSelectedTest(test); setFormData({...formData, result_value: '', result_notes: ''}); setShowResultModal(true); }} className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                  Ввести результат
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Новый QC тест</h2>
              <button onClick={() => setShowCreateModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Тип теста</label>
                <select value={formData.test_type} onChange={e => setFormData({...formData, test_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="sterility">Стерильность</option>
                  <option value="mycoplasma">Микоплазма</option>
                  <option value="viability">Жизнеспособность</option>
                  <option value="identity">Идентичность</option>
                  <option value="potency">Эффективность</option>
                  <option value="endotoxin">Эндотоксины</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Метод</label>
                <input type="text" value={formData.test_method} onChange={e => setFormData({...formData, test_method: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Например: ПЦР, культуральный" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID культуры (опционально)</label>
                <input type="number" value={formData.culture_id} onChange={e => setFormData({...formData, culture_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button onClick={handleCreate} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Создать тест</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Результат теста {selectedTest.test_code}</h2>
              <button onClick={() => { setShowResultModal(false); setSelectedTest(null); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Статус</label>
                <select value={formData.result_status} onChange={e => setFormData({...formData, result_status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="pass">Пройден</option>
                  <option value="fail">Не пройден</option>
                  <option value="inconclusive">Неопределённо</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Значение результата</label>
                <input type="text" value={formData.result_value} onChange={e => setFormData({...formData, result_value: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Например: 98% жизнеспособность" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Примечания</label>
                <textarea value={formData.result_notes} onChange={e => setFormData({...formData, result_notes: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button onClick={handleRecordResult} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Сохранить результат</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
