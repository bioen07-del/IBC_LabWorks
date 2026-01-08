import { X, Download, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  title: string
  subtitle?: string
}

export function QRCodeModal({ isOpen, onClose, code, title, subtitle }: QRCodeModalProps) {
  if (!isOpen) return null

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `${code}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${code}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              font-family: sans-serif;
            }
            .label { font-size: 24px; font-weight: bold; margin-top: 20px; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${document.getElementById('qr-code-svg')?.outerHTML}
          <div class="label">${code}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center py-6 bg-slate-50 rounded-lg">
          <QRCodeSVG 
            id="qr-code-svg"
            value={code} 
            size={200}
            level="H"
            includeMargin
          />
          <p className="mt-4 font-mono font-bold text-lg">{code}</p>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Скачать PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Печать
          </button>
        </div>
      </div>
    </div>
  )
}
