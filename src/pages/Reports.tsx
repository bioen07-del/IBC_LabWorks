import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileSpreadsheet, Download, FileText, Calendar, Filter } from 'lucide-react';

type ReportType = 'cultures' | 'donors' | 'orders' | 'releases' | 'inventory' | 'deviations' | 'qc_tests';

interface ReportConfig {
  name: string;
  description: string;
  table: string;
  columns: string[];
  headers: string[];
}

const reportConfigs: Record<ReportType, ReportConfig> = {
  cultures: {
    name: 'Культуры',
    description: 'Список всех клеточных культур',
    table: 'cultures',
    columns: ['culture_code', 'cell_type', 'passage_number', 'status', 'created_at'],
    headers: ['Код', 'Тип клеток', 'Пассаж', 'Статус', 'Дата создания']
  },
  donors: {
    name: 'Доноры',
    description: 'Реестр доноров',
    table: 'donors',
    columns: ['donor_code', 'first_name', 'last_name', 'blood_type', 'status', 'created_at'],
    headers: ['Код', 'Имя', 'Фамилия', 'Группа крови', 'Статус', 'Дата регистрации']
  },
  orders: {
    name: 'Заказы',
    description: 'Все заказы клиентов',
    table: 'orders',
    columns: ['order_code', 'client_name', 'cell_type_required', 'quantity_required', 'status', 'created_at'],
    headers: ['Код заказа', 'Клиент', 'Тип клеток', 'Количество', 'Статус', 'Дата']
  },
  releases: {
    name: 'Выдачи',
    description: 'Журнал выдач продукции',
    table: 'releases',
    columns: ['release_code', 'release_date', 'status', 'created_at'],
    headers: ['Код выдачи', 'Дата выдачи', 'Статус', 'Дата создания']
  },
  inventory: {
    name: 'Инвентарь',
    description: 'Складские остатки',
    table: 'inventory',
    columns: ['item_code', 'item_name', 'category', 'quantity', 'unit', 'expiry_date'],
    headers: ['Код', 'Наименование', 'Категория', 'Количество', 'Ед.изм.', 'Срок годности']
  },
  deviations: {
    name: 'Отклонения',
    description: 'Зарегистрированные отклонения',
    table: 'deviations',
    columns: ['deviation_code', 'title', 'severity', 'status', 'created_at'],
    headers: ['Код', 'Название', 'Критичность', 'Статус', 'Дата']
  },
  qc_tests: {
    name: 'QC Тесты',
    description: 'Результаты контроля качества',
    table: 'qc_tests',
    columns: ['test_code', 'test_type', 'result', 'status', 'performed_at'],
    headers: ['Код теста', 'Тип', 'Результат', 'Статус', 'Дата проведения']
  }
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const loadPreview = async (reportType: ReportType) => {
    setSelectedReport(reportType);
    setLoading(true);
    const config = reportConfigs[reportType];
    
    let query = supabase.from(config.table as any).select(config.columns.join(',')).limit(10);
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }
    
    const { data } = await query;
    setPreviewData(data || []);
    setLoading(false);
  };

  const exportCSV = async (reportType: ReportType) => {
    const config = reportConfigs[reportType];
    setLoading(true);
    
    let query = supabase.from(config.table as any).select(config.columns.join(','));
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }
    
    const { data } = await query;
    
    if (data && data.length > 0) {
      const csv = [
        config.headers.join(';'),
        ...data.map(row => config.columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val).replace(/;/g, ',');
        }).join(';'))
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.table}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          Отчёты и экспорт
        </h1>
      </div>

      {/* Фильтры по дате */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">С:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">По:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Типы отчётов */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {(Object.keys(reportConfigs) as ReportType[]).map(type => {
          const config = reportConfigs[type];
          return (
            <div
              key={type}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition hover:shadow-md ${
                selectedReport === type ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => loadPreview(type)}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium">{config.name}</h3>
              </div>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Превью и экспорт */}
      {selectedReport && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">{reportConfigs[selectedReport].name} - Предпросмотр (10 записей)</h2>
            <button
              onClick={() => exportCSV(selectedReport)}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {reportConfigs[selectedReport].headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-sm font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      {reportConfigs[selectedReport].columns.map((col, j) => (
                        <td key={j} className="px-4 py-3 text-sm">
                          {row[col] !== null && row[col] !== undefined 
                            ? (typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]))
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Нет данных</div>
          )}
        </div>
      )}
    </div>
  );
}
