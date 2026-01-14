// MISSING-003: Сервис печати этикеток
// Поддержка ZPL (Zebra), ESC/POS и браузерной печати

export interface LabelData {
  code: string           // Код контейнера/культуры
  barcode?: string       // Штрихкод/QR
  type: 'container' | 'culture' | 'cryovial' | 'media_batch'
  passage?: number
  date?: string
  expiry?: string
  cellType?: string
  donorCode?: string
  additionalInfo?: string[]
}

export interface PrinterConfig {
  name: string
  type: 'zpl' | 'escpos' | 'browser'
  address?: string       // IP для сетевых принтеров
  port?: number
  labelWidth?: number    // мм
  labelHeight?: number   // мм
}

// Генерация ZPL кода для Zebra принтеров
export function generateZPL(label: LabelData, config: PrinterConfig): string {
  const dpi = 203 // стандартное разрешение Zebra
  const widthDots = Math.round((config.labelWidth || 50) * dpi / 25.4)
  const heightDots = Math.round((config.labelHeight || 25) * dpi / 25.4)
  
  let zpl = `^XA` // Начало этикетки
  zpl += `^PW${widthDots}` // Ширина
  zpl += `^LL${heightDots}` // Высота
  
  // Заголовок (код)
  zpl += `^FO20,20^A0N,40,40^FD${label.code}^FS`
  
  // Тип
  const typeLabels: Record<string, string> = {
    container: 'КОНТЕЙНЕР',
    culture: 'КУЛЬТУРА',
    cryovial: 'КРИОВИАЛ',
    media_batch: 'ПАРТИЯ СРЕДЫ'
  }
  zpl += `^FO20,70^A0N,25,25^FD${typeLabels[label.type] || label.type}^FS`
  
  // Пассаж (если есть)
  if (label.passage !== undefined) {
    zpl += `^FO20,100^A0N,30,30^FDP${label.passage}^FS`
  }
  
  // Дата
  if (label.date) {
    zpl += `^FO20,135^A0N,20,20^FD${label.date}^FS`
  }
  
  // Штрихкод Code128
  if (label.barcode || label.code) {
    zpl += `^FO200,20^BCN,80,Y,N,N^FD${label.barcode || label.code}^FS`
  }
  
  // QR код
  zpl += `^FO${widthDots - 120},20^BQN,2,4^FDQA,${label.code}^FS`
  
  // Дополнительная информация
  if (label.additionalInfo) {
    label.additionalInfo.forEach((info, idx) => {
      zpl += `^FO20,${160 + idx * 25}^A0N,18,18^FD${info}^FS`
    })
  }
  
  zpl += `^XZ` // Конец этикетки
  
  return zpl
}

// Генерация HTML для браузерной печати
export function generateHTMLLabel(label: LabelData): string {
  const typeLabels: Record<string, string> = {
    container: 'КОНТЕЙНЕР',
    culture: 'КУЛЬТУРА', 
    cryovial: 'КРИОВИАЛ',
    media_batch: 'ПАРТИЯ СРЕДЫ'
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: 50mm 25mm; margin: 0; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 2mm; 
          font-size: 10pt;
        }
        .label {
          width: 46mm;
          height: 21mm;
          border: 0.5pt solid #000;
          padding: 2mm;
          box-sizing: border-box;
        }
        .code { font-size: 14pt; font-weight: bold; }
        .type { font-size: 8pt; color: #666; margin-top: 1mm; }
        .passage { font-size: 12pt; font-weight: bold; margin-top: 1mm; }
        .date { font-size: 8pt; color: #333; }
        .qr { position: absolute; right: 2mm; top: 2mm; }
        .info { font-size: 7pt; color: #555; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="code">${label.code}</div>
        <div class="type">${typeLabels[label.type] || label.type}</div>
        ${label.passage !== undefined ? `<div class="passage">P${label.passage}</div>` : ''}
        ${label.date ? `<div class="date">${label.date}</div>` : ''}
        ${label.cellType ? `<div class="info">${label.cellType}</div>` : ''}
        ${label.donorCode ? `<div class="info">Донор: ${label.donorCode}</div>` : ''}
        ${label.expiry ? `<div class="info">Годен до: ${label.expiry}</div>` : ''}
      </div>
    </body>
    </html>
  `
}

// Печать через браузер
export function printLabelBrowser(label: LabelData): void {
  const html = generateHTMLLabel(label)
  const printWindow = window.open('', '_blank', 'width=300,height=200')
  
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    
    // Даем время на загрузку стилей
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

// Печать нескольких этикеток
export function printLabels(labels: LabelData[], config?: PrinterConfig): void {
  if (!config || config.type === 'browser') {
    // Браузерная печать - открываем все в одном окне
    const allHtml = labels.map(l => generateHTMLLabel(l)).join('<div style="page-break-after: always;"></div>')
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            @media print { .page-break { page-break-after: always; } }
          </style>
        </head>
        <body>${allHtml}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  } else if (config.type === 'zpl' && config.address) {
    // Сетевой принтер Zebra - отправка через fetch
    const zplData = labels.map(l => generateZPL(l, config)).join('\n')
    
    // В реальном приложении здесь будет отправка на сервер печати
    console.log('ZPL data for network printer:', zplData)
    alert('Для сетевой печати требуется настройка сервера печати')
  }
}

// Предустановленные принтеры
export const defaultPrinters: PrinterConfig[] = [
  { name: 'Браузер (PDF)', type: 'browser', labelWidth: 50, labelHeight: 25 },
  { name: 'Zebra ZD420', type: 'zpl', labelWidth: 50, labelHeight: 25 },
  { name: 'Zebra ZD620', type: 'zpl', labelWidth: 100, labelHeight: 50 },
]

// Генерация этикетки для контейнера
export function createContainerLabel(container: {
  container_code: string
  passage_number?: number
  container_types?: { type_name: string } | null
  cultures?: { culture_code: string; cell_type?: string } | null
}): LabelData {
  return {
    code: container.container_code,
    type: 'container',
    passage: container.passage_number,
    date: new Date().toLocaleDateString('ru-RU'),
    cellType: container.cultures?.cell_type,
    additionalInfo: [
      container.container_types?.type_name || '',
      container.cultures?.culture_code || ''
    ].filter(Boolean)
  }
}

// Генерация этикетки для криовиала
export function createCryovialLabel(cryovial: {
  container_code: string
  passage_number?: number
  cultures?: { culture_code: string; cell_type?: string } | null
  frozen_at?: string
}): LabelData {
  return {
    code: cryovial.container_code,
    type: 'cryovial',
    passage: cryovial.passage_number,
    date: cryovial.frozen_at ? new Date(cryovial.frozen_at).toLocaleDateString('ru-RU') : undefined,
    cellType: cryovial.cultures?.cell_type,
    additionalInfo: [
      cryovial.cultures?.culture_code || '',
      'КРИОБАНК'
    ].filter(Boolean)
  }
}
