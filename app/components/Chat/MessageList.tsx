'use client'

import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { Message } from './ChatRoom'

interface MessageListProps {
  messages: Message[]
  currentUserEmail: string
  onAddReaction?: (messageId: string, emoji: string) => void
  typingUsers?: string[]
}

export default function MessageList({ 
  messages, 
  currentUserEmail, 
  onAddReaction,
  typingUsers = [] 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(function () {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map(function (message) {
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.userEmail === currentUserEmail}
              onAddReaction={onAddReaction}
            />
          )
        })
      )}
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-gray-600">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}
