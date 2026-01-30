'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Wrench, Clock, MessageSquare, Calendar, ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { th } from 'date-fns/locale'
import Link from 'next/link'
import { clsx } from 'clsx'
import type { Notification } from '@/types/database.types'

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

const typeLabels = {
  assignment: 'มอบหมายงาน',
  sla_warning: 'แจ้งเตือน SLA',
  status_change: 'เปลี่ยนสถานะ',
  chat: 'ข้อความใหม่',
  scheduled: 'งานตามกำหนด',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100) as { data: Notification[] | null }

    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true } as never).eq('id', id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coffee-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-coffee-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-coffee-900">การแจ้งเตือน</h1>
            <p className="text-sm text-coffee-500">
              {unreadCount > 0 ? `${unreadCount} รายการยังไม่ได้อ่าน` : 'อ่านทั้งหมดแล้ว'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-coffee-600 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            อ่านทั้งหมด
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            filter === 'all'
              ? 'bg-coffee-600 text-white'
              : 'bg-white text-coffee-600 hover:bg-coffee-50 border border-coffee-200'
          )}
        >
          ทั้งหมด ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            filter === 'unread'
              ? 'bg-coffee-600 text-white'
              : 'bg-white text-coffee-600 hover:bg-coffee-50 border border-coffee-200'
          )}
        >
          ยังไม่ได้อ่าน ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-coffee-100 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
            const colorClass = typeColors[notification.type as keyof typeof typeColors] || 'bg-coffee-100 text-coffee-600'
            const typeLabel = typeLabels[notification.type as keyof typeof typeLabels] || notification.type

            return (
              <div
                key={notification.id}
                className={clsx(
                  'p-4 border-b border-coffee-50 hover:bg-cream-50 transition-colors',
                  !notification.is_read && 'bg-blue-50/50'
                )}
              >
                <div className="flex gap-4">
                  <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={clsx(
                          'inline-block px-2 py-0.5 text-xs rounded-full mb-1',
                          colorClass
                        )}>
                          {typeLabel}
                        </span>
                        <p className={clsx(
                          'text-sm text-coffee-900',
                          !notification.is_read && 'font-semibold'
                        )}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-coffee-500 mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-coffee-400 mt-2">
                          {notification.created_at && format(new Date(notification.created_at), 'dd MMM yyyy เวลา HH:mm น.', { locale: th })}
                          {' • '}
                          {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.is_read && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {notification.request_id && (
                        <Link
                          href={`/requests/${notification.request_id}`}
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-medium text-coffee-600 hover:text-coffee-800 hover:underline"
                        >
                          ดูรายละเอียดงาน →
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-coffee-400 hover:text-coffee-600 ml-auto"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-coffee-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-coffee-400" />
            </div>
            <p className="text-coffee-600 font-medium">ไม่มีการแจ้งเตือน</p>
            <p className="text-sm text-coffee-400 mt-1">
              {filter === 'unread' ? 'คุณอ่านการแจ้งเตือนทั้งหมดแล้ว' : 'ยังไม่มีการแจ้งเตือนในขณะนี้'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
