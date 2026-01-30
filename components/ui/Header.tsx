'use client'

import { Profile } from '@/types/database.types'
import NotificationBell from './NotificationBell'
import { Coffee, Sparkles } from 'lucide-react'

interface HeaderProps {
  profile: Profile | null
}

export default function Header({ profile }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white/90 backdrop-blur-md border-b border-coffee-100/50 z-40 transition-all duration-300">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-coffee-500 via-honey-500 to-coffee-500" />

      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile spacer for menu button */}
        <div className="lg:hidden flex-1" />

        {/* Left side - Welcome message (Desktop only) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 text-coffee-600">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-honey-100 to-honey-200 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-honey-600" />
            </div>
            <div>
              <p className="text-xs text-coffee-400">ยินดีต้อนรับ</p>
              <p className="text-sm font-medium text-coffee-700">{profile?.name || 'ผู้ใช้งาน'}</p>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {profile && (
            <div className="relative">
              <NotificationBell userId={profile.id} />
            </div>
          )}

          {/* Mobile logo indicator */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-lg flex items-center justify-center shadow-md">
              <Coffee className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
