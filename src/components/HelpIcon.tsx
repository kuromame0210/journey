'use client'

import { useState } from 'react'
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface HelpIconProps {
  title: string
  content: string | React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function HelpIcon({ 
  title, 
  content, 
  size = 'md'
}: HelpIconProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-gray-50"
        aria-label="ヘルプを表示"
      >
        <QuestionMarkCircleIcon className={sizeClasses[size]} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4">
                {typeof content === 'string' ? (
                  <p className="text-gray-700 leading-relaxed">{content}</p>
                ) : (
                  content
                )}
              </div>
              
              {/* Footer */}
              <div className="flex justify-end p-4 border-t">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}