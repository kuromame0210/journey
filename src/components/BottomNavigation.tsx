'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid, ChatBubbleLeftRightIcon as ChatIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid'

const navigation = [
  { name: 'ホーム', href: '/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'チャット', href: '/chat', icon: ChatBubbleLeftRightIcon, iconSolid: ChatIconSolid },
  { name: 'マイページ', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
]

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center relative">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = isActive ? item.iconSolid : item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
        
        {/* FAB for creating new place */}
        <Link
          href="/place/create"
          className="absolute -top-6 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  )
}