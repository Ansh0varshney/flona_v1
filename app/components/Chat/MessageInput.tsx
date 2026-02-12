'use client'

import { useState, KeyboardEvent, ChangeEvent, useRef, useEffect } from 'react'

interface MessageInputProps {
  onSend(text: string): void
  onTyping?: (isTyping: boolean) => void
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [text, setText] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  function handleSend() {
    if (text.trim()) {
      onSend(text.trim())
      setText('')
      
      // Stop typing when message is sent
      if (isTypingRef.current && onTyping) {
        onTyping(false)
        isTypingRef.current = false
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  function handleKeyPress(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newText = e.target.value
    setText(newText)

    if (!onTyping) return

    // Start typing indicator
    if (newText.length > 0 && !isTypingRef.current) {
      onTyping(true)
      isTypingRef.current = true
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    if (newText.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          onTyping(false)
          isTypingRef.current = false
        }
      }, 3000) // Stop typing indicator after 3 seconds of inactivity
    } else {
      // Stop typing immediately if input is empty
      if (isTypingRef.current) {
        onTyping(false)
        isTypingRef.current = false
      }
    }
  }

  return (
    <div className="bg-white border-t p-4">
      <div className="max-w-4xl mx-auto flex gap-2">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
