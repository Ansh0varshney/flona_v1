'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPUS_BOUNDS_ARRAY } from '@/lib/events'

export type EventMarker = {
  id: number
  title: string
  description: string
  lat: number
  lng: number
  locationName: string
  startTime: string
  endTime: string
  creator: {
    name: string | null
  }
}

type CampusMapProps = {
  events: EventMarker[]
  onMapClick: (lat: number, lng: number) => void
  onMarkerClick: (eventId: number) => void
  selectedLocation?: { lat: number; lng: number } | null
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function CampusMap({ events, onMapClick, onMarkerClick, selectedLocation }: CampusMapProps) {
  useEffect(() => {
    // Fix default marker icons in Leaflet with bundlers
    delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const center: [number, number] = [22.3165, 87.3068]

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full"
      maxBounds={CAMPUS_BOUNDS_ARRAY}
      maxBoundsViscosity={1.0}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      {events.map((event) => (
        <Marker key={event.id} position={[event.lat, event.lng]}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{event.title}</div>
              <div className="text-gray-600">{event.locationName}</div>
              <button
                className="mt-2 text-blue-600 hover:text-blue-700"
                onClick={() => onMarkerClick(event.id)}
                type="button"
              >
                View details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
          <Popup>
            <div className="text-sm text-gray-900">Selected location</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
