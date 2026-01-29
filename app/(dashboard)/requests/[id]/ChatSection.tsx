'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Chat } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

interface ChatWithSender extends Chat {
  sender: { name: string } | null
}

interface ChatSectionProps {
  requestId: string
  currentUserId: string
}

export default function ChatSection({ requestId, currentUserId }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data } = await supabase
        .from('chats')
        .select('*, sender:profiles!chats_sender_id_fkey(name)')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      setMessages((data as ChatWithSender[]) || [])
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to realtime updates
    const supabase = createClient()
    const channel = supabase
      .channel(`chats:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `request_id=eq.${requestId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('chats')
            .select('*, sender:profiles!chats_sender_id_fkey(name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as ChatWithSender])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    const supabase = createClient()

    await (supabase.from('chats') as ReturnType<typeof supabase.from>).insert({
      request_id: requestId,
      sender_id: currentUserId,
      message: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-coffee-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="max-h-80 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-coffee-400 text-sm py-8">
            ยังไม่มีข้อความ เริ่มสนทนาได้เลย
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? 'bg-coffee-700 text-white rounded-br-md'
                      : 'bg-cream-100 text-coffee-900 rounded-bl-md'
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-medium text-coffee-600 mb-1">
                      {msg.sender?.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? 'text-coffee-300' : 'text-coffee-400'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at!), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-coffee-100 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="input flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary px-4"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  )
}
