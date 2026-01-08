import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Plus, Search, X, FileText, CheckCircle, Clock, Shield, Ban, Trash2 } from 'lucide-react';

interface Deviation {
  id: number;
  deviation_code: string;
  deviation_type: string;
  severity: string;
  description: string;
  status: string;
  detected_at: string;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  qp_review_required: boolean;
  qp_review_decision: string | null;
  qp_review_comments: string | null;
  qp_reviewed_at: string | null;
  culture_id: number | null;
  container_id: number | null;
  resolved_at: string | null;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  major: 'bg-orange-100 text-orange-800',
  minor: 'bg-yellow-100 text-yellow-800'
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  escalated: 'bg-red-100 text-red-800'
};

export default function Deviations() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCAPAModal, setShowCAPAModal] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);
  const [formData, setFormData] = useState({
    deviation_type: 'other',
    severity: 'minor',
    description: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: ''
  });
  const [showQPModal, setShowQPModal] = useState(false);
  const [qpDecision, setQpDecision] = useState<'continue' | 'quarantine' | 'dispose'>('continue');
  const [qpComments, setQpComments] = useState('');

  useEffect(() => {
    fetchDeviations();
  }, [statusFilter]);

  const fetchDeviations = async () => {
    setLoading(true);
    let query = supabase
      .from('deviations')
      .select('*')
      .order('detected_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }

    const { data } = await query;
    setDeviations(data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const d = new Date();
    return `DEV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
  };

  const handleCreate = async () => {
    await (supabase.from('deviations') as any).insert({
      deviation_code: generateCode(),
      deviation_type: formData.deviation_type,
      severity: formData.severity,
      description: formData.description,
      detected_by_user_id: 1,
      status: 'open',
      qp_review_required: formData.severity === 'critical'
    });
    setShowCreateModal(false);
    setFormData({ deviation_type: 'other', severity: 'minor', description: '', root_cause: '', corrective_action: '', preventive_action: '' });
    fetchDeviations();
  };

  const handleUpdateCAPA = async () => {
    if (!selectedDeviation) return;
    await supabase.from('deviations').update({
      root_cause: formData.root_cause,
      corrective_action: formData.corrective_action,
      preventive_action: formData.preventive_action,
      status: 'under_review' as const
    }).eq('id', selectedDeviation.id);
    setShowCAPAModal(false);
    setSelectedDeviation(null);
    fetchDeviations();
  };

  const handleClose = async (id: number) => {
    await supabase.from('deviations').update({ status: 'resolved' as const, resolved_at: new Date().toISOString() }).eq('id', id);
    fetchDeviations();
  };

  // QP решение
  const handleQPDecision = async () => {
    if (!selectedDeviation) return;

    // Обновляем отклонение
    await supabase.from('deviations').update({
      qp_review_decision: qpDecision as any,
      qp_review_comments: qpComments || null,
      qp_reviewed_at: new Date().toISOString(),
      qp_reviewed_by_user_id: 1,
      status: qpDecision === 'continue' ? 'resolved' as const : 'under_review' as const,
      resolved_at: qpDecision === 'continue' ? new Date().toISOString() : null
    }).eq('id', selectedDeviation.id);

    // Применяем решение к контейнеру/культуре
    if (qpDecision === 'quarantine') {
      if (selectedDeviation.container_id) {
        await supabase.from('containers').update({
          quality_hold: 'qp' as const,
          hold_reason: `QP решение по ${selectedDeviation.deviation_code}: карантин`,
          hold_set_at: new Date().toISOString(),
          hold_set_by_user_id: 1
        }).eq('id', selectedDeviation.container_id);
      }
      if (selectedDeviation.culture_id) {
        await supabase.from('cultures').update({
          risk_flag: 'at_risk' as const,
          risk_flag_reason: `QP решение по ${selectedDeviation.deviation_code}: карантин`,
          risk_flag_set_at: new Date().toISOString()
        }).eq('id', selectedDeviation.culture_id);
      }
      // Создаём задачу на перемещение в карантин
      await supabase.from('tasks').insert({
        task_code: `TASK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        task_type: 'move_to_quarantine',
        priority: 'high',
        title: `Переместить в карантин: ${selectedDeviation.deviation_code}`,
        description: `QP решение: карантин. ${qpComments}`,
        assigned_to_role: 'operator',
        culture_id: selectedDeviation.culture_id,
        container_id: selectedDeviation.container_id,
        deviation_id: selectedDeviation.id,
        status: 'pending'
      });
    } else if (qpDecision === 'dispose') {
      if (selectedDeviation.container_id) {
        await supabase.from('containers').update({
          status: 'disposed' as const,
          disposed_at: new Date().toISOString()
        }).eq('id', selectedDeviation.container_id);
      }
      if (selectedDeviation.culture_id) {
        await supabase.from('cultures').update({
          status: 'disposed' as const,
          risk_flag: 'critical' as const,
          risk_flag_reason: `QP решение по ${selectedDeviation.deviation_code}: утилизация`
        }).eq('id', selectedDeviation.culture_id);
      }
      // Создаём задачу на утилизацию
      await supabase.from('tasks').insert({
        task_code: `TASK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        task_type: 'dispose_container',
        priority: 'high',
        title: `Утилизировать: ${selectedDeviation.deviation_code}`,
        description: `QP решение: утилизация. ${qpComments}`,
        assigned_to_role: 'operator',
        culture_id: selectedDeviation.culture_id,
        container_id: selectedDeviation.container_id,
        deviation_id: selectedDeviation.id,
        status: 'pending'
      });
      // Закрываем отклонение
      await supabase.from('deviations').update({
        status: 'resolved' as const,
        resolved_at: new Date().toISOString()
      }).eq('id', selectedDeviation.id);
    }

    setShowQPModal(false);
    setSelectedDeviation(null);
    setQpComments('');
    setQpDecision('continue');
    fetchDeviations();
  };

  const filtered = deviations.filter(d =>
    d.deviation_code.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    open: deviations.filter(d => d.status === 'open').length,
    underReview: deviations.filter(d => d.status === 'under_review').length,
    escalated: deviations.filter(d => d.status === 'escalated').length,
    resolved: deviations.filter(d => d.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Отклонения и CAPA
          </h1>
          <p className="text-slate-500">Управление отклонениями и корректирующими действиями</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Зарегистрировать
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Открытые', value: stats.open, icon: AlertTriangle, color: 'text-blue-600' },
          { label: 'На проверке', value: stats.underReview, icon: Clock, color: 'text-purple-600' },
          { label: 'Эскалировано', value: stats.escalated, icon: FileText, color: 'text-red-600' },
          { label: 'Решено', value: stats.resolved, icon: CheckCircle, color: 'text-green-600' }
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
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
          <option value="all">Все статусы</option>
          <option value="open">Открытые</option>
          <option value="under_review">На проверке</option>
          <option value="escalated">Эскалировано</option>
          <option value="resolved">Решено</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">Отклонения не найдены</div>
        ) : filtered.map(dev => (
          <div key={dev.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold">{dev.deviation_code}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[dev.severity]}`}>{dev.severity}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[dev.status] || 'bg-slate-100'}`}>{dev.status}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{dev.deviation_type}</span>
                </div>
                <p className="text-sm text-slate-700">{dev.description}</p>
                <p className="text-xs text-slate-400">Обнаружено: {new Date(dev.detected_at).toLocaleString('ru-RU')}</p>
                {dev.root_cause && <div className="mt-2 p-2 bg-slate-50 rounded text-sm"><strong>Причина:</strong> {dev.root_cause}</div>}
              </div>
              {dev.status !== 'resolved' && (
                <div className="flex gap-2 flex-wrap">
                  {dev.qp_review_required && !dev.qp_review_decision && (
                    <button
                      onClick={() => { setSelectedDeviation(dev); setShowQPModal(true); }}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Shield className="h-3 w-3" /> QP Решение
                    </button>
                  )}
                  {dev.qp_review_decision && (
                    <span className={`px-2 py-1 text-xs rounded ${
                      dev.qp_review_decision === 'continue' ? 'bg-green-100 text-green-800' :
                      dev.qp_review_decision === 'quarantine' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      QP: {dev.qp_review_decision === 'continue' ? 'Продолжить' : dev.qp_review_decision === 'quarantine' ? 'Карантин' : 'Утилизация'}
                    </span>
                  )}
                  <button onClick={() => { setSelectedDeviation(dev); setFormData({...formData, root_cause: dev.root_cause||'', corrective_action: dev.corrective_action||'', preventive_action: dev.preventive_action||''}); setShowCAPAModal(true); }} className="px-3 py-1 text-sm border rounded hover:bg-slate-50">CAPA</button>
                  <button onClick={() => handleClose(dev.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Закрыть</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Новое отклонение</h2>
              <button onClick={() => setShowCreateModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select value={formData.deviation_type} onChange={e => setFormData({...formData, deviation_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="cca_fail">CCA Fail</option>
                    <option value="contamination">Контаминация</option>
                    <option value="equipment_failure">Отказ оборудования</option>
                    <option value="documentation">Документация</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Критичность</label>
                  <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="minor">Незначительное</option>
                    <option value="major">Значительное</option>
                    <option value="critical">Критическое</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Подробное описание..." />
              </div>
              <button onClick={handleCreate} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Зарегистрировать</button>
            </div>
          </div>
        </div>
      )}

      {/* QP Decision Modal */}
      {showQPModal && selectedDeviation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                QP Решение: {selectedDeviation.deviation_code}
              </h2>
              <button onClick={() => { setShowQPModal(false); setSelectedDeviation(null); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">{selectedDeviation.description}</p>
              <p className="text-xs text-slate-500 mt-1">Критичность: {selectedDeviation.severity}</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setQpDecision('continue')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    qpDecision === 'continue' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${qpDecision === 'continue' ? 'text-green-600' : 'text-slate-400'}`} />
                  <div className="font-medium">Продолжить</div>
                  <div className="text-xs text-slate-500">Риск приемлем</div>
                </button>
                <button
                  onClick={() => setQpDecision('quarantine')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    qpDecision === 'quarantine' ? 'border-yellow-500 bg-yellow-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Ban className={`h-8 w-8 mx-auto mb-2 ${qpDecision === 'quarantine' ? 'text-yellow-600' : 'text-slate-400'}`} />
                  <div className="font-medium">Карантин</div>
                  <div className="text-xs text-slate-500">Изолировать</div>
                </button>
                <button
                  onClick={() => setQpDecision('dispose')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    qpDecision === 'dispose' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Trash2 className={`h-8 w-8 mx-auto mb-2 ${qpDecision === 'dispose' ? 'text-red-600' : 'text-slate-400'}`} />
                  <div className="font-medium">Утилизация</div>
                  <div className="text-xs text-slate-500">Уничтожить</div>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Комментарий QP</label>
                <textarea
                  value={qpComments}
                  onChange={e => setQpComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Обоснование решения..."
                />
              </div>
              <button
                onClick={handleQPDecision}
                className={`w-full py-3 text-white rounded-lg font-medium ${
                  qpDecision === 'continue' ? 'bg-green-600 hover:bg-green-700' :
                  qpDecision === 'quarantine' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                Подтвердить решение
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPA Modal */}
      {showCAPAModal && selectedDeviation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">CAPA для {selectedDeviation.deviation_code}</h2>
              <button onClick={() => { setShowCAPAModal(false); setSelectedDeviation(null); }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Корневая причина</label>
                <textarea value={formData.root_cause} onChange={e => setFormData({...formData, root_cause: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Корректирующие действия</label>
                <textarea value={formData.corrective_action} onChange={e => setFormData({...formData, corrective_action: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Предупреждающие действия</label>
                <textarea value={formData.preventive_action} onChange={e => setFormData({...formData, preventive_action: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button onClick={handleUpdateCAPA} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Сохранить CAPA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
