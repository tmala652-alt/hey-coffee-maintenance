'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Wrench, Clock, MessageSquare, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import Link from 'next/link'
import { clsx } from 'clsx'
import type { Notification } from '@/types/database.types'

interface NotificationBellProps {
  userId: string
}

const typeIcons = {
  assignment: Wrench,
  sla_warning: Clock,
  status_change: Check,
  chat: MessageSquare,
  scheduled: Calendar,
}

const typeColors = {
  assignment: 'bg-blue-100 text-blue-600',
  sla_warning: 'bg-cherry-100 text-cherry-600',
  status_change: 'bg-matcha-100 text-matcha-600',
  chat: 'bg-honey-100 text-honey-600',
  scheduled: 'bg-purple-100 text-purple-600',
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-coffee-600 hover:bg-coffee-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-cherry-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-coffee-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-coffee-100">
              <h3 className="font-semibold text-coffee-900">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-coffee-500 hover:text-coffee-700 flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
                  const colorClass = typeColors[notification.type as keyof typeof typeColors] || 'bg-coffee-100 text-coffee-600'

                  return (
                    <div
                      key={notification.id}
                      className={clsx(
                        'p-3 border-b border-coffee-50 hover:bg-cream-50 transition-colors cursor-pointer',
                        !notification.is_read && 'bg-blue-50/50'
                      )}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.request_id) {
                          window.location.href = `/requests/${notification.request_id}`
                        }
                        setOpen(false)
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            'text-sm text-coffee-900 line-clamp-2',
                            !notification.is_read && 'font-medium'
                          )}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-coffee-500 mt-0.5 line-clamp-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-coffee-400 mt-1">
                            {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-10 w-10 text-coffee-300 mx-auto mb-2" />
                  <p className="text-coffee-500">ไม่มีการแจ้งเตือน</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block p-3 text-center text-sm text-coffee-600 hover:bg-cream-50 border-t border-coffee-100"
              >
                ดูทั้งหมด
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
