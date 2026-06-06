'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ChatMessage } from '@/types'

interface ChatMessageProps {
  message: ChatMessage
  isOwn?: boolean
}

export function ChatMessage({ message, isOwn = false }: ChatMessageProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.user?.avatar_url} alt={message.user?.full_name} />
        <AvatarFallback>{message.user ? getInitials(message.user.full_name) : '??'}</AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{message.user?.full_name || 'Usuário'}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          </span>
        </div>
        
        <div className={`rounded-lg px-4 py-2 ${
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm break-words">{message.message}</p>
        </div>
      </div>
    </div>
  )
}
