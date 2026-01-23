import { ReactNode, useState } from 'react'
import { HelpCircle, Info, AlertCircle } from 'lucide-react'

interface TooltipProps {
  children: ReactNode
  content: string | ReactNode
  type?: 'info' | 'help' | 'warning'
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: string
  showIcon?: boolean
  iconOnly?: boolean
}

export function Tooltip({
  children,
  content,
  type = 'info',
  position = 'top',
  maxWidth = '300px',
  showIcon = true,
  iconOnly = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const getIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-8 border-x-transparent border-x-8 border-b-0'
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-b-8 border-x-transparent border-x-8 border-t-0'
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-l-8 border-y-transparent border-y-8 border-r-0'
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-r-8 border-y-transparent border-y-8 border-l-0'
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-8 border-x-transparent border-x-8 border-b-0'
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      {!iconOnly && children}

      <div
        className="cursor-help inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {showIcon && getIcon()}
      </div>

      {isVisible && (
        <div
          className={`absolute ${getPositionClasses()} z-50 animate-in fade-in-0 zoom-in-95`}
          style={{ maxWidth }}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg px-3 py-2">
            {content}
          </div>
          <div className={`absolute ${getArrowClasses()} w-0 h-0`} />
        </div>
      )}
    </div>
  )
}

export default Tooltip
