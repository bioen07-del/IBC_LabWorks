import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, Search, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';

interface Task {
  id: number;
  task_code: string;
  task_type: string;
  priority: string;
  title: string;
  description: string | null;
  assigned_to_user_id: number | null;
  assigned_to_role: string | null;
  culture_id: number | null;
  deviation_id: number | null;
  due_date: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  users?: { full_name: string } | { error: true } | null;
  cultures?: { culture_code: string } | null;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

const statusColors: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const taskTypeLabels: Record<string, string> = {
  qc_check: 'QC проверка',
  move_to_quarantine: 'Перемещение в карантин',
  dispose_container: 'Утилизация контейнера',
  investigation: 'Расследование',
  sterility_test: 'Тест стерильности',
  post_thaw_test: 'Post-thaw тест',
  other: 'Другое'
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    task_type: 'other',
    priority: 'medium',
    title: '',
    description: '',
    assigned_to_role: 'operator',
    due_date: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from('tasks')
      .select(`
        *,
        users:assigned_to_user_id(full_name),
        cultures(culture_code)
      `)
      .order('due_date', { ascending: true });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setTasks((data || []) as Task[]);
    setLoading(false);
  };

  const generateCode = () => {
    const d = new Date();
    return `TASK-${d.getFullYear()}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
  };

  const handleCreate = async () => {
    await supabase.from('tasks').insert({
      task_code: generateCode(),
      task_type: formData.task_type,
      priority: formData.priority,
      title: formData.title,
      description: formData.description,
      assigned_to_role: formData.assigned_to_role,
      due_date: formData.due_date || null,
      status: 'pending'
    });
    setShowCreateModal(false);
    setFormData({ task_type: 'other', priority: 'medium', title: '', description: '', assigned_to_role: 'operator', due_date: '' });
    fetchTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    }).eq('id', task.id);
    fetchTasks();
  };

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.task_code.toLowerCase().includes(search.toLowerCase())
  );

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          Задачи
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Создать задачу
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или коду..."
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
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'pending').length}</div>
          <div className="text-sm text-gray-600">Ожидает</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{tasks.filter(t => t.status === 'in_progress').length}</div>
          <div className="text-sm text-gray-600">В работе</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{tasks.filter(t => isOverdue(t)).length}</div>
          <div className="text-sm text-gray-600">Просрочено</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-sm text-gray-600">Завершено</div>
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
                <th className="px-4 py-3 text-left text-sm font-medium">Код</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Тип</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Приоритет</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Назначено</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Дедлайн</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(task => (
                <tr key={task.id} className={isOverdue(task) ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 font-mono text-sm">{task.task_code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{task.title}</div>
                    {task.cultures && (
                      <div className="text-xs text-gray-500">Культура: {task.cultures.culture_code}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{taskTypeLabels[task.task_type] || task.task_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(task.users && 'full_name' in task.users) ? task.users.full_name : task.assigned_to_role || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {task.due_date ? (
                      <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                        {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        {isOverdue(task) && ' ⚠️'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[task.status] || 'bg-gray-100'}`}>
                      {task.status === 'pending' ? 'Ожидает' :
                       task.status === 'in_progress' ? 'В работе' :
                       task.status === 'completed' ? 'Завершено' : 'Отменено'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(task, 'in_progress')}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="Взять в работу"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {(task.status === 'pending' || task.status === 'in_progress') && (
                        <button
                          onClick={() => handleStatusChange(task, 'completed')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Завершить"
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
                    Задачи не найдены
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
            <h2 className="text-xl font-bold mb-4">Создать задачу</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Тип задачи</label>
                <select
                  value={formData.task_type}
                  onChange={e => setFormData({...formData, task_type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="qc_check">QC проверка</option>
                  <option value="move_to_quarantine">Перемещение в карантин</option>
                  <option value="dispose_container">Утилизация контейнера</option>
                  <option value="investigation">Расследование</option>
                  <option value="sterility_test">Тест стерильности</option>
                  <option value="post_thaw_test">Post-thaw тест</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Приоритет</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="critical">Критический</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Назначить роли</label>
                <select
                  value={formData.assigned_to_role}
                  onChange={e => setFormData({...formData, assigned_to_role: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="operator">Оператор</option>
                  <option value="qc">QC</option>
                  <option value="qp">QP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Дедлайн</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
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
                disabled={!formData.title}
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
