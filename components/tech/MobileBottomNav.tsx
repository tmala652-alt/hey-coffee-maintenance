'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Camera, User } from 'lucide-react'
import clsx from 'clsx'

interface MobileBottomNavProps {
  className?: string
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'หน้าหลัก',
      href: '/tech',
      icon: Home,
    },
    {
      name: 'งาน',
      href: '/tech/jobs',
      icon: ClipboardList,
    },
    {
      name: 'ถ่ายรูป',
      href: '/tech/camera',
      icon: Camera,
    },
    {
      name: 'โปรไฟล์',
      href: '/settings',
      icon: User,
    },
  ]

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-coffee-100 safe-area-bottom lg:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-coffee-700'
                  : 'text-coffee-400 hover:text-coffee-600'
              )}
            >
              <item.icon
                className={clsx(
                  'h-6 w-6 mb-1 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute bottom-1 w-6 h-1 bg-coffee-700 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
