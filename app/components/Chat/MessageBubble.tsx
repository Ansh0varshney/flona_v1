'use client'

import { Message } from './ChatRoom'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '👏']

export default function MessageBubble({ message, isOwn, onAddReaction }: MessageBubbleProps) {
  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
      {/* Quick reactions (show on hover) - positioned to the left */}
      {onAddReaction && (
        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onAddReaction(message.id, emoji)}
                className="hover:scale-125 transition-transform text-sm"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <p className="text-xs text-gray-600 mb-1 ml-2">{message.userName}</p>
        )}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <p className="break-words">{message.text}</p>
        </div>
        
        {/* Reactions */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1 ml-2">
            {Object.entries(message.reactions!).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => onAddReaction?.(message.id, emoji)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs hover:bg-gray-50 transition"
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600">{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
