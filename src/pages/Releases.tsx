import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Plus, Search, FileCheck, Download, CheckCircle, FileText } from 'lucide-react';

interface Release {
  id: number;
  release_code: string;
  order_id: number | null;
  culture_id: number | null;
  container_ids: any;
  release_date: string;
  qp_approved_by_user_id: number | null;
  qp_approved_at: string | null;
  certificate_of_analysis_url: string | null;
  status: string;
  created_at: string;
  orders?: { order_code: string; client_name: string } | null;
  cultures?: { culture_code: string; cell_type: string } | null;
}

const statusColors: Record<string, string> = {
  pending_qp: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  pending_qp: 'Ожидает QP',
  approved: 'Утверждено',
  shipped: 'Отгружено',
  delivered: 'Доставлено',
  rejected: 'Отклонено'
};

export default function Releases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [cultures, setCultures] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    order_id: '',
    culture_id: '',
    release_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReleases();
    fetchOrders();
    fetchCultures();
  }, [statusFilter]);

  const fetchReleases = async () => {
    setLoading(true);
    let query = supabase
      .from('releases')
      .select(`*, orders(order_code, client_name), cultures(culture_code, cell_type)`)
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }
    const { data } = await query;
    setReleases((data || []) as Release[]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('id, order_code, client_name').eq('status', 'ready');
    setOrders(data || []);
  };

  const fetchCultures = async () => {
    const { data } = await supabase.from('cultures').select('id, culture_code, cell_type').eq('status', 'active');
    setCultures(data || []);
  };

  const generateCode = () => {
    const d = new Date();
    return `REL-${d.getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
  };

  const handleCreate = async () => {
    await supabase.from('releases').insert({
      release_code: generateCode(),
      order_id: formData.order_id ? parseInt(formData.order_id) : null,
      culture_id: formData.culture_id ? parseInt(formData.culture_id) : null,
      release_date: formData.release_date,
      status: 'pending_qp'
    });
    setShowCreateModal(false);
    setFormData({ order_id: '', culture_id: '', release_date: new Date().toISOString().split('T')[0] });
    fetchReleases();
  };

  const handleApprove = async (release: Release) => {
    await supabase.from('releases').update({
      status: 'approved',
      qp_approved_at: new Date().toISOString()
    }).eq('id', release.id);
    fetchReleases();
  };

  const handleRelease = async (release: Release) => {
    await supabase.from('releases').update({ status: 'shipped' as const }).eq('id', release.id);
    // Обновляем статус заказа
    if (release.order_id) {
      await supabase.from('orders').update({ status: 'shipped' as const }).eq('id', release.order_id);
    }
    fetchReleases();
  };

  const generateCertificate = (release: Release) => {
    const content = `
      <html>
      <head>
        <title>Сертификат выдачи ${release.release_code}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          h1 { margin: 10px 0; font-size: 28px; }
          .info { margin: 20px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { width: 200px; font-weight: bold; color: #666; }
          .info-value { flex: 1; }
          .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          .stamp { color: green; font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🧬 BMCP Platform</div>
          <h1>СЕРТИФИКАТ ВЫДАЧИ</h1>
          <div>Certificate of Release</div>
        </div>
        
        <div class="info">
          <div class="info-row">
            <div class="info-label">Номер сертификата:</div>
            <div class="info-value">${release.release_code}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Дата выдачи:</div>
            <div class="info-value">${release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}</div>
          </div>
          ${release.orders ? `
          <div class="info-row">
            <div class="info-label">Заказ:</div>
            <div class="info-value">${release.orders.order_code}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Клиент:</div>
            <div class="info-value">${release.orders.client_name}</div>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Информация о продукте</div>
          ${release.cultures ? `
          <div class="info-row">
            <div class="info-label">Код культуры:</div>
            <div class="info-value">${release.cultures.culture_code}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Тип клеток:</div>
            <div class="info-value">${release.cultures.cell_type}</div>
          </div>
          ` : '<div>Нет данных о культуре</div>'}
        </div>

        <div class="section">
          <div class="section-title">Статус качества</div>
          ${release.status === 'approved' || release.status === 'shipped' || release.status === 'delivered' ? `
          <div class="stamp">✓ ОДОБРЕНО (QP Approved)</div>
          <div class="info-row">
            <div class="info-label">Дата одобрения:</div>
            <div class="info-value">${release.qp_approved_at ? new Date(release.qp_approved_at).toLocaleString('ru-RU') : '-'}</div>
          </div>
          ` : '<div style="color: orange;">⏳ Ожидает одобрения QP</div>'}
        </div>

        <div class="signature">
          <div class="signature-box">
            <div class="signature-line">Ответственное лицо (QP)</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Получатель</div>
          </div>
        </div>

        <div class="footer">
          <p>Документ сформирован автоматически системой BMCP Platform</p>
          <p>Дата формирования: ${new Date().toLocaleString('ru-RU')}</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filtered = releases.filter(r =>
    r.release_code.toLowerCase().includes(search.toLowerCase()) ||
    r.orders?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.cultures?.culture_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Выдачи (Releases)
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Новая выдача
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">Все статусы</option>
          <option value="pending_qp">Ожидает QP</option>
          <option value="approved">Утверждено</option>
          <option value="shipped">Отгружено</option>
          <option value="delivered">Доставлено</option>
        </select>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{releases.filter(r => r.status === 'pending_qp').length}</div>
          <div className="text-sm text-gray-600">Ожидает QP</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{releases.filter(r => r.status === 'approved').length}</div>
          <div className="text-sm text-gray-600">Утверждено</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{releases.filter(r => r.status === 'shipped').length}</div>
          <div className="text-sm text-gray-600">Отгружено</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{releases.length}</div>
          <div className="text-sm text-gray-600">Всего</div>
        </div>
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Код выдачи</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Заказ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Культура</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Клиент</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Дата выдачи</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(release => (
                <tr key={release.id}>
                  <td className="px-4 py-3 font-mono text-sm">{release.release_code}</td>
                  <td className="px-4 py-3">{release.orders?.order_code || '-'}</td>
                  <td className="px-4 py-3">
                    {release.cultures && (
                      <div>
                        <div className="font-medium">{release.cultures.culture_code}</div>
                        <div className="text-xs text-gray-500">{release.cultures.cell_type}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{release.orders?.client_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[release.status] || 'bg-gray-100'}`}>
                      {statusLabels[release.status] || release.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {release.status === 'pending_qp' && (
                        <button
                          onClick={() => handleApprove(release)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Утвердить (QP)"
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                      )}
                      {release.status === 'approved' && (
                        <button
                          onClick={() => handleRelease(release)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Выдать"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(release.status === 'approved' || release.status === 'shipped' || release.status === 'delivered') && (
                        <button
                          onClick={() => generateCertificate(release)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Сертификат выдачи"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {release.certificate_of_analysis_url && (
                        <a
                          href={release.certificate_of_analysis_url}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Скачать CoA"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Выдачи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка создания */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Новая выдача</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Заказ</label>
                <select
                  value={formData.order_id}
                  onChange={e => setFormData({...formData, order_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Выберите заказ --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_code} - {o.client_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Культура *</label>
                <select
                  value={formData.culture_id}
                  onChange={e => setFormData({...formData, culture_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Выберите культуру --</option>
                  {cultures.map(c => (
                    <option key={c.id} value={c.id}>{c.culture_code} ({c.cell_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Дата выдачи</label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={e => setFormData({...formData, release_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.culture_id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
