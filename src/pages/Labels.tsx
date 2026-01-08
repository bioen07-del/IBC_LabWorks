import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, QrCode, Tag, Search, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type LabelType = 'culture' | 'container' | 'inventory' | 'donor';

interface LabelData {
  id: number;
  code: string;
  title: string;
  subtitle?: string;
  details: string[];
}

export default function Labels() {
  const [labelType, setLabelType] = useState<LabelType>('culture');
  const [items, setItems] = useState<LabelData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    loadItems();
  }, [labelType]);

  const loadItems = async () => {
    setLoading(true);
    setSelected([]);
    let data: LabelData[] = [];

    if (labelType === 'culture') {
      const { data: cultures } = await supabase.from('cultures').select('id, culture_code, cell_type, current_passage, status');
      data = (cultures || []).map((c: any) => ({
        id: c.id,
        code: c.culture_code,
        title: c.cell_type || 'Культура',
        subtitle: `Пассаж: ${c.current_passage || 0}`,
        details: [`Статус: ${c.status}`]
      }));
    } else if (labelType === 'container') {
      const { data: containers } = await supabase.from('containers').select('id, container_code, container_types(type_name)');
      data = (containers || []).map((c: any) => ({
        id: c.id,
        code: c.container_code,
        title: c.container_types?.type_name || 'Контейнер',
        details: []
      }));
    } else if (labelType === 'inventory') {
      const { data: inv } = await supabase.from('media_component_batches' as any).select('id, batch_code, component_name, quantity_prepared, unit');
      data = (inv || []).map((i: any) => ({
        id: i.id,
        code: i.batch_code || `INV-${i.id}`,
        title: i.component_name || 'Компонент',
        subtitle: 'Инвентарь',
        details: i.quantity_prepared ? [`${i.quantity_prepared} ${i.unit || ''}`] : []
      }));
    } else if (labelType === 'donor') {
      const { data: donors } = await supabase.from('donors').select('id, donor_code, full_name, blood_type');
      data = (donors || []).map(d => ({
        id: d.id,
        code: d.donor_code,
        title: d.full_name || 'Донор',
        subtitle: `Группа крови: ${d.blood_type || '-'}`,
        details: []
      }));
    }

    setItems(data);
    setLoading(false);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === filteredItems.length) {
      setSelected([]);
    } else {
      setSelected(filteredItems.map(i => i.id));
    }
  };

  const filteredItems = items.filter(i =>
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItems = items.filter(i => selected.includes(i.id));

  const printLabels = () => {
    const sizeStyles = {
      small: { width: '50mm', height: '25mm', fontSize: '8px', qrSize: 40 },
      medium: { width: '70mm', height: '35mm', fontSize: '10px', qrSize: 60 },
      large: { width: '100mm', height: '50mm', fontSize: '12px', qrSize: 80 }
    };
    const size = sizeStyles[labelSize];

    const labelsHtml = selectedItems.map(item => `
      <div style="width: ${size.width}; height: ${size.height}; border: 1px solid #ccc; padding: 4mm; margin: 2mm; display: inline-flex; align-items: center; gap: 3mm; page-break-inside: avoid; font-family: Arial, sans-serif;">
        <div style="flex-shrink: 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=${size.qrSize}x${size.qrSize}&data=${encodeURIComponent(item.code)}" />
        </div>
        <div style="flex: 1; overflow: hidden;">
          <div style="font-weight: bold; font-size: ${size.fontSize}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.code}</div>
          <div style="font-size: calc(${size.fontSize} - 1px); color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
          ${item.subtitle ? `<div style="font-size: calc(${size.fontSize} - 2px); color: #666;">${item.subtitle}</div>` : ''}
          ${item.details.map(d => `<div style="font-size: calc(${size.fontSize} - 2px); color: #888;">${d}</div>`).join('')}
        </div>
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Печать этикеток</title>
          <style>
            @page { margin: 5mm; }
            body { margin: 0; padding: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-wrap: wrap;">
            ${labelsHtml}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6" />
          Печать этикеток
        </h1>
        {selected.length > 0 && (
          <button
            onClick={printLabels}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Печать ({selected.length})
          </button>
        )}
      </div>

      {/* Настройки */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Тип этикетки</label>
            <select
              value={labelType}
              onChange={e => setLabelType(e.target.value as LabelType)}
              className="border rounded px-3 py-2"
            >
              <option value="culture">Культуры</option>
              <option value="container">Контейнеры</option>
              <option value="inventory">Инвентарь</option>
              <option value="donor">Доноры</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Размер</label>
            <select
              value={labelSize}
              onChange={e => setLabelSize(e.target.value as any)}
              className="border rounded px-3 py-2"
            >
              <option value="small">Маленький (50x25мм)</option>
              <option value="medium">Средний (70x35мм)</option>
              <option value="large">Большой (100x50мм)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по коду или названию..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Список */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-medium">Доступные объекты</h2>
            <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
              {selected.length === filteredItems.length ? 'Снять всё' : 'Выбрать все'}
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 border-b cursor-pointer flex items-center gap-3 hover:bg-gray-50 ${
                    selected.includes(item.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <QrCode className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-mono font-medium">{item.code}</div>
                    <div className="text-sm text-gray-600">{item.title}</div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">Нет данных</div>
              )}
            </div>
          )}
        </div>

        {/* Превью */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-medium">Превью этикетки</h2>
          </div>
          <div className="p-6">
            {selectedItems.length > 0 ? (
              <div className="space-y-4">
                {selectedItems.slice(0, 3).map(item => (
                  <div key={item.id} className="border rounded-lg p-4 flex items-center gap-4 bg-gray-50">
                    <QRCodeSVG value={item.code} size={labelSize === 'small' ? 48 : labelSize === 'medium' ? 64 : 80} />
                    <div>
                      <div className="font-mono font-bold">{item.code}</div>
                      <div className="text-sm">{item.title}</div>
                      {item.subtitle && <div className="text-xs text-gray-500">{item.subtitle}</div>}
                      {item.details.map((d, i) => <div key={i} className="text-xs text-gray-400">{d}</div>)}
                    </div>
                  </div>
                ))}
                {selectedItems.length > 3 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... и ещё {selectedItems.length - 3} этикеток
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Выберите объекты для печати
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
