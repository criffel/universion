'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import type { ChatMessage as ChatMessageType } from '@/types'

interface ChatContainerProps {
  messages: ChatMessageType[]
  onSendMessage: (message: string) => void
  currentUserId?: string
  disabled?: boolean
  placeholder?: string
}

export function ChatContainer({
  messages,
  onSendMessage,
  currentUserId,
  disabled = false,
  placeholder = 'Digite sua mensagem...'
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full gap-4">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a se apresentar!</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.user_id === currentUserId}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <ChatInput
        onSendMessage={onSendMessage}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  )
}
