'use client'

import { LightBulbIcon, InformationCircleIcon, HeartIcon } from '@heroicons/react/24/outline'

interface ContextHintProps {
  type?: 'tip' | 'info' | 'match'
  children: React.ReactNode
  className?: string
  dismissible?: boolean
}

export default function ContextHint({ 
  type = 'tip', 
  children, 
  className = '',
  dismissible = false
}: ContextHintProps) {
  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <LightBulbIcon className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />
      case 'match':
        return <HeartIcon className="h-4 w-4 text-pink-500" />
      default:
        return <LightBulbIcon className="h-4 w-4 text-yellow-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'tip':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'match':
        return 'bg-pink-50 border-pink-200'
      default:
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className={`${getBgColor()} border rounded-lg p-3 ${className}`}>
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 text-sm text-gray-700">
          {children}
        </div>
      </div>
    </div>
  )
}