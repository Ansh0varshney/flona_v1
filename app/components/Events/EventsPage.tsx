'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import CampusMap, { type EventMarker } from './CampusMap'
import { isWithinCampus } from '@/lib/events'

type CommentItem = {
  id: number
  content: string
  createdAt: string
  user: {
    name: string | null
    image: string | null
  }
}

export default function EventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<EventMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createLat, setCreateLat] = useState<number | null>(null)
  const [createLng, setCreateLng] = useState<number | null>(null)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createStartTime, setCreateStartTime] = useState('')
  const [createEndTime, setCreateEndTime] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [currentUserFlonaName, setCurrentUserFlonaName] = useState<string>('Anonymous')

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  )

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/events', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load events')
      }
      const data = (await response.json()) as EventMarker[]
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function loadComments(eventId: number) {
    setCommentLoading(true)
    setCommentError(null)
    try {
      const response = await fetch(`/api/comments?event_id=${eventId}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load comments')
      }
      const data = (await response.json()) as CommentItem[]
      setComments(data)
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setCommentLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Fetch current user's flona name
  useEffect(() => {
    async function loadCurrentUserFlonaName() {
      if (session?.user?.flonaName) {
        setCurrentUserFlonaName(session.user.flonaName)
      } else if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/flona-name?email=${encodeURIComponent(session.user.email)}`)
          if (response.ok) {
            const data = await response.json()
            setCurrentUserFlonaName(data.flonaName || 'Anonymous')
          }
        } catch {
          setCurrentUserFlonaName('Anonymous')
        }
      }
    }
    loadCurrentUserFlonaName()
  }, [session])

  useEffect(() => {
    if (selectedEventId) {
      loadComments(selectedEventId)
    } else {
      setComments([])
    }
  }, [selectedEventId])

  function handleMapClick(lat: number, lng: number) {
    if (!isCreating) {
      return
    }

    if (!isWithinCampus(lat, lng)) {
      setCreateError('Please choose a point inside campus bounds.')
      return
    }

    setCreateLat(lat)
    setCreateLng(lng)
    setCreateError(null)
  }

  async function handleCreateEvent() {
    if (createLat === null || createLng === null) {
      setCreateError('Please click on the map inside campus bounds.')
      return
    }

    if (!createTitle.trim() || !createDescription.trim()) {
      setCreateError('Title and description are required.')
      return
    }

    if (!createStartTime || !createEndTime) {
      setCreateError('Start and end times are required.')
      return
    }

    const startTimeIso = new Date(createStartTime).toISOString()
    const endTimeIso = new Date(createEndTime).toISOString()

    try {
      setCreateError(null)
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createTitle,
          description: createDescription,
          lat: createLat,
          lng: createLng,
          startTime: startTimeIso,
          endTime: endTimeIso,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to create event')
      }

      setIsCreating(false)
      setCreateTitle('')
      setCreateDescription('')
      setCreateStartTime('')
      setCreateEndTime('')
      setCreateLat(null)
      setCreateLng(null)
      await loadEvents()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create event')
    }
  }

  async function handleAddComment() {
    if (!selectedEventId) return

    if (!commentContent.trim()) {
      setCommentError('Comment cannot be empty.')
      return
    }

    try {
      setCommentError(null)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          content: commentContent,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to add comment')
      }

      setCommentContent('')
      await loadComments(selectedEventId)
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  function handleSignOut() {
    signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex">
        {/* Map Section */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white m-4 rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-180px)]">
            <CampusMap events={events} onMapClick={handleMapClick} onMarkerClick={setSelectedEventId} selectedLocation={createLat && createLng ? { lat: createLat, lng: createLng } : null} />
          </div>
          <div className="px-4 pb-4 text-sm text-gray-600">
            {isCreating ? 'Click on the map to place your event' : 'Click "Add Event" button to create'}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
          {!isCreating ? (
            <>
              {/* Events List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Events</h2>
                  {loading && <div className="text-sm text-gray-600">Loading...</div>}
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {!loading && events.length === 0 && (
                    <div className="text-sm text-gray-500">No events yet</div>
                  )}
                  <div className="space-y-3">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEventId(event.id)
                        }}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
                      >
                        <div className="font-semibold text-gray-900 text-sm">{event.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{event.locationName}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(event.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {event.creator?.name ?? 'Anonymous'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Event Button */}
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => {
                    setIsCreating(true)
                    setCreateError(null)
                    setCreateLat(null)
                    setCreateLng(null)
                  }}
                  className="px-8 py-3 text-sm font-semibold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition min-w-[200px]"
                >
                  + Add Event
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Create Event Form */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Create Event</h2>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setCreateTitle('')
                      setCreateDescription('')
                      setCreateStartTime('')
                      setCreateEndTime('')
                      setCreateLat(null)
                      setCreateLng(null)
                      setCreateError(null)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      placeholder="Event title"
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400"
                      value={createTitle}
                      onChange={(event) => setCreateTitle(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      placeholder="Event description"
                      className="mt-1 w-full px-3 py-2 border rounded-lg min-h-[80px] text-gray-900 placeholder:text-gray-400"
                      value={createDescription}
                      onChange={(event) => setCreateDescription(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-gray-900"
                      value={createStartTime}
                      onChange={(event) => setCreateStartTime(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-gray-900"
                      value={createEndTime}
                      onChange={(event) => setCreateEndTime(event.target.value)}
                    />
                  </div>

                  {createLat !== null && createLng !== null && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xs font-semibold text-green-900">Location Selected</div>
                      <div className="text-xs text-green-700 mt-1">
                        Lat: {createLat.toFixed(4)}, Lng: {createLng.toFixed(4)}
                      </div>
                    </div>
                  )}

                  {createError && <div className="text-sm text-red-600 p-2 bg-red-50 rounded-lg">{createError}</div>}

                  <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded-lg">
                    Click on the map inside campus bounds to set the event location.
                  </div>
                </div>
              </div>

              {/* Create Event Footer */}
              <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={handleCreateEvent}
                  disabled={!createLat}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Create Event
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setCreateTitle('')
                    setCreateDescription('')
                    setCreateStartTime('')
                    setCreateEndTime('')
                    setCreateLat(null)
                    setCreateLng(null)
                    setCreateError(null)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[9999]">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-500">{selectedEvent.locationName}</p>
                <p className="text-xs text-gray-400 mt-1">Hosted by: {selectedEvent.creator?.name ?? 'Anonymous'}</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedEventId(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 text-gray-700 whitespace-pre-line">{selectedEvent.description}</div>
            <div className="mt-4 text-sm text-gray-600">
              <div>Starts: {new Date(selectedEvent.startTime).toLocaleString()}</div>
              <div>Ends: {new Date(selectedEvent.endTime).toLocaleString()}</div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
              {commentLoading && <div className="text-sm text-gray-600 mt-2">Loading comments...</div>}
              {commentError && <div className="text-sm text-red-600 mt-2">{commentError}</div>}
              <div className="mt-3 space-y-3">
                {comments.length === 0 && !commentLoading && (
                  <div className="text-sm text-gray-500">Be the first to comment.</div>
                )}
                {comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">
                      {comment.user.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-900 mt-1 whitespace-pre-line">{comment.content}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <textarea
                  className="w-full px-3 py-2 border rounded-lg min-h-[80px] text-gray-900 placeholder:text-gray-400"
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(event) => setCommentContent(event.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  {commentError && <div className="text-sm text-red-600">{commentError}</div>}
                  <button
                    className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    onClick={handleAddComment}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
