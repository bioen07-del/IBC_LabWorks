import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Plus, Search, Eye, Truck, CheckCircle } from 'lucide-react';

interface Order {
  id: number;
  order_code: string;
  client_name: string;
  client_contact: any;
  cell_type_required: string;
  quantity_required: number;
  delivery_date_target: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  received: 'Получен',
  in_production: 'В производстве',
  ready: 'Готов к выдаче',
  delivered: 'Доставлен',
  cancelled: 'Отменён'
};

const priorityLabels: Record<string, string> = {
  standard: 'Стандартный',
  urgent: 'Срочный',
  critical: 'Критический'
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    cell_type_required: 'MSC',
    quantity_required: 1,
    delivery_date_target: '',
    priority: 'standard'
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }
    const { data } = await query;
    setOrders((data || []) as Order[]);
    setLoading(false);
  };

  const generateCode = () => {
    const d = new Date();
    return `ORD-${d.getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
  };

  const handleCreate = async () => {
    await supabase.from('orders').insert({
      order_code: generateCode(),
      client_name: formData.client_name,
      client_contact: { email: formData.client_email, phone: formData.client_phone },
      cell_type_required: formData.cell_type_required,
      quantity_required: formData.quantity_required,
      delivery_date_target: formData.delivery_date_target || null,
      priority: formData.priority as 'standard' | 'urgent' | 'critical',
      status: 'received' as const
    });
    setShowCreateModal(false);
    setFormData({ client_name: '', client_email: '', client_phone: '', cell_type_required: 'MSC', quantity_required: 1, delivery_date_target: '', priority: 'standard' });
    fetchOrders();
  };

  const handleStatusChange = async (order: Order, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus as any }).eq('id', order.id);
    fetchOrders();
  };

  const filtered = orders.filter(o =>
    o.order_code.toLowerCase().includes(search.toLowerCase()) ||
    o.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Заказы
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Новый заказ
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по коду или клиенту..."
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
          <option value="received">Получен</option>
          <option value="in_production">В производстве</option>
          <option value="ready">Готов к выдаче</option>
          <option value="delivered">Доставлен</option>
        </select>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'received').length}</div>
          <div className="text-sm text-gray-600">Новых</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'in_production').length}</div>
          <div className="text-sm text-gray-600">В производстве</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'ready').length}</div>
          <div className="text-sm text-gray-600">Готово</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{orders.filter(o => o.status === 'delivered').length}</div>
          <div className="text-sm text-gray-600">Доставлено</div>
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
                <th className="px-4 py-3 text-left text-sm font-medium">Код заказа</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Клиент</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Тип клеток</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Кол-во</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Дата доставки</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Приоритет</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-sm">{order.order_code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.client_name}</div>
                    {order.client_contact?.email && (
                      <div className="text-xs text-gray-500">{order.client_contact.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{order.cell_type_required}</td>
                  <td className="px-4 py-3">{order.quantity_required}</td>
                  <td className="px-4 py-3 text-sm">
                    {order.delivery_date_target ? new Date(order.delivery_date_target).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{priorityLabels[order.priority] || order.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.status === 'received' && (
                        <button
                          onClick={() => handleStatusChange(order, 'in_production')}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="В производство"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'in_production' && (
                        <button
                          onClick={() => handleStatusChange(order, 'ready')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Готов к выдаче"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Заказы не найдены
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
            <h2 className="text-xl font-bold mb-4">Новый заказ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Клиент *</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Название организации"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={e => setFormData({...formData, client_email: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={e => setFormData({...formData, client_phone: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип клеток</label>
                  <select
                    value={formData.cell_type_required}
                    onChange={e => setFormData({...formData, cell_type_required: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="MSC">MSC</option>
                    <option value="iPSC">iPSC</option>
                    <option value="HSC">HSC</option>
                    <option value="Fibroblast">Фибробласты</option>
                    <option value="Keratinocyte">Кератиноциты</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Количество</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity_required}
                    onChange={e => setFormData({...formData, quantity_required: parseInt(e.target.value) || 1})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата доставки</label>
                  <input
                    type="date"
                    value={formData.delivery_date_target}
                    onChange={e => setFormData({...formData, delivery_date_target: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Приоритет</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="standard">Стандартный</option>
                    <option value="urgent">Срочный</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
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
                disabled={!formData.client_name}
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
