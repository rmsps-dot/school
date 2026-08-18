'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Search, Crosshair, Link as LinkIcon, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'

interface LocationMapPickerProps {
  lat: number | null
  lng: number | null
  radiusMeters: number
  locationName: string
  onChange: (data: { lat: number | null; lng: number | null; radiusMeters: number; locationName: string }) => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any
  }
}

export default function LocationMapPicker({
  lat,
  lng,
  radiusMeters,
  locationName,
  onChange,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [parseStatus, setParseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // Default fallback center (Bihar / India default if null)
  const currentLat = lat ?? 26.1121
  const currentLng = lng ?? 86.6069

  // Helper to parse google maps link or raw coordinates
  const parseLocationInput = (input: string): { lat: number; lng: number } | null => {
    if (!input || !input.trim()) return null
    const text = decodeURIComponent(input.trim())

    // 1. Check raw coordinates format: "26.1121, 86.6069" or "26.1121 86.6069"
    const rawCoordsMatch = text.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/)
    if (rawCoordsMatch) {
      const pLat = parseFloat(rawCoordsMatch[1])
      const pLng = parseFloat(rawCoordsMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 2. Check @lat,lng in google maps URLs: .../@26.1121,86.6069,17z...
    const atMatch = text.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/)
    if (atMatch) {
      const pLat = parseFloat(atMatch[1])
      const pLng = parseFloat(atMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 3. Check query param ?q=lat,lng or ?ll=lat,lng or ?loc:lat,lng
    const qMatch = text.match(/[?&](?:q|ll|query|loc|center)=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/)
    if (qMatch) {
      const pLat = parseFloat(qMatch[1])
      const pLng = parseFloat(qMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 4. Check geo:lat,lng
    const geoMatch = text.match(/geo:(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/)
    if (geoMatch) {
      const pLat = parseFloat(geoMatch[1])
      const pLng = parseFloat(geoMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    return null
  }

  const isValidCoord = (l1: number, l2: number) => {
    return !isNaN(l1) && !isNaN(l2) && l1 >= -90 && l1 <= 90 && l2 >= -180 && l2 <= 180
  }

  const handleLinkExtract = () => {
    setParseStatus(null)
    const result = parseLocationInput(linkInput)
    if (result) {
      onChange({
        lat: Number(result.lat.toFixed(6)),
        lng: Number(result.lng.toFixed(6)),
        radiusMeters,
        locationName: locationName || 'School Campus',
      })
      setParseStatus({
        type: 'success',
        message: `Extracted coordinates: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`,
      })
      updateMapPosition(result.lat, result.lng)
    } else {
      setParseStatus({
        type: 'error',
        message: 'Could not extract latitude and longitude. Please paste a valid Google Maps link or coordinates (e.g. 26.1121, 86.6069).',
      })
    }
  }

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Inject Leaflet JS
    if (!window.L) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => setMapLoaded(true)
      script.onerror = () => setMapError('Failed to load interactive map library.')
      document.body.appendChild(script)
    } else {
      setMapLoaded(true)
    }
  }, [])

  // Update map marker and circle position
  const updateMapPosition = useCallback((targetLat: number, targetLng: number) => {
    if (!mapInstanceRef.current || !window.L) return

    mapInstanceRef.current.setView([targetLat, targetLng], Math.max(mapInstanceRef.current.getZoom(), 16))

    if (markerRef.current) {
      markerRef.current.setLatLng([targetLat, targetLng])
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([targetLat, targetLng])
      circleRef.current.setRadius(radiusMeters)
    }
  }, [radiusMeters])

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current || !window.L) return

    try {
      const L = window.L
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: true,
      })

      // OpenStreetMap Tiles with attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      // Custom pulsing coral marker icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(241,145,125,0.3); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative; width:22px; height:22px; border-radius:50%; background:#F1917D; border:3px solid #0B0B10; box-shadow:0 0 10px rgba(241,145,125,0.8); display:flex; align-items:center; justify-content:center;">
              <div style="width:6px; height:6px; border-radius:50%; background:#0B0B10;"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      // Draggable marker
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map)

      // Geofence Radius Circle
      const circle = L.circle([currentLat, currentLng], {
        color: '#F1917D',
        fillColor: '#F1917D',
        fillOpacity: 0.15,
        weight: 2,
        radius: radiusMeters,
      }).addTo(map)

      markerRef.current = marker
      circleRef.current = circle
      mapInstanceRef.current = map

      // Marker drag event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on('drag', (e: any) => {
        const pos = e.latlng
        circle.setLatLng(pos)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng()
        onChange({
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6)),
          radiusMeters,
          locationName,
        })
      })

      // Map click event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', (e: any) => {
        const pos = e.latlng
        marker.setLatLng(pos)
        circle.setLatLng(pos)
        onChange({
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6)),
          radiusMeters,
          locationName,
        })
      })
    } catch (e) {
      console.error('Error initializing map:', e)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded])

  // Sync radius circle updates
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeters)
    }
  }, [radiusMeters])

  // Geolocation detection
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setParseStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' })
      return
    }

    setIsLocating(true)
    setParseStatus(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const userLat = Number(pos.coords.latitude.toFixed(6))
        const userLng = Number(pos.coords.longitude.toFixed(6))
        onChange({
          lat: userLat,
          lng: userLng,
          radiusMeters,
          locationName: locationName || 'Current GPS Location',
        })
        setParseStatus({
          type: 'success',
          message: `Detected GPS location: ${userLat}, ${userLng} (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`,
        })
        updateMapPosition(userLat, userLng)
      },
      (err) => {
        setIsLocating(false)
        setParseStatus({ type: 'error', message: `GPS Error: ${err.message}` })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Address Search via Nominatim OpenStreetMap
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setParseStatus(null)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const pLat = Number(parseFloat(data[0].lat).toFixed(6))
        const pLng = Number(parseFloat(data[0].lon).toFixed(6))
        const displayName = data[0].display_name
        onChange({
          lat: pLat,
          lng: pLng,
          radiusMeters,
          locationName: displayName ? displayName.split(',')[0] : locationName,
        })
        setParseStatus({
          type: 'success',
          message: `Found place: ${data[0].display_name}`,
        })
        updateMapPosition(pLat, pLng)
      } else {
        setParseStatus({ type: 'error', message: 'Place not found. Try searching with city or landmark name.' })
      }
    } catch {
      setParseStatus({ type: 'error', message: 'Search failed. Please check network connection.' })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Option A: Paste Google Maps Link or Raw Coordinates ── */}
      <div className="p-4 rounded-2xl bg-ink/40 border border-hairline space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-coral" />
          <h3 className="text-xs font-bold text-parchment uppercase tracking-wider">
            Option 1: Paste Google Maps Link / Location URL
          </h3>
        </div>
        <p className="text-xs text-mist">
          Paste any Google Maps link (e.g. <code>https://maps.google.com/?q=26.1121,86.6069</code>), share link, or raw coordinates (<code>26.1121, 86.6069</code>).
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Paste Google Maps URL or lat, lng..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="flex-1 input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors"
          />
          <button
            type="button"
            onClick={handleLinkExtract}
            className="px-4 py-2.5 rounded-xl bg-veena-blue text-ink text-xs font-bold hover:bg-veena-blue/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Extract & Pin
          </button>
        </div>
      </div>

      {/* ── Status Feedback Banner ── */}
      {parseStatus && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono ${
            parseStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {parseStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{parseStatus.message}</span>
        </div>
      )}

      {/* ── Option B: Interactive Map & Live Search ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-coral" />
            <h3 className="text-xs font-bold text-parchment uppercase tracking-wider">
              Option 2: Interactive Map Picker & GPS Pin
            </h3>
          </div>
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isLocating}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-coral/15 border border-coral/30 hover:bg-coral/25 text-coral text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting GPS...' : '📍 Use My Current Location'}
          </button>
        </div>

        {/* Search location bar */}
        <form onSubmit={handleSearchPlace} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search school address, landmark, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-glass rounded-xl pl-9 pr-4 py-2 text-xs text-parchment focus:outline-none focus:border-coral transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-2 rounded-xl bg-ink border border-hairline text-parchment hover:border-mist text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Map Container */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-hairline bg-ink shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map error or loading overlay */}
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/90 text-mist text-xs gap-2">
              <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
              <span>Loading map engine...</span>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/90 text-red-400 text-xs p-4 text-center">
              {mapError}
            </div>
          )}

          {/* Quick instructions floating badge */}
          <div className="absolute bottom-2 left-2 z-10 bg-ink/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-hairline text-[11px] text-parchment shadow-lg pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            <span>Click map or drag pin to set exact school gate</span>
          </div>
        </div>
      </div>

      {/* ── Geofence Radius & Coordinates Tuning ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-hairline">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mist uppercase tracking-wider">Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={lat ?? ''}
            placeholder="e.g. 26.112100"
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseFloat(e.target.value)
              onChange({ lat: val, lng, radiusMeters, locationName })
              if (val !== null && lng !== null) updateMapPosition(val, lng)
            }}
            className="w-full input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-mist uppercase tracking-wider">Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={lng ?? ''}
            placeholder="e.g. 86.606900"
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseFloat(e.target.value)
              onChange({ lat, lng: val, radiusMeters, locationName })
              if (lat !== null && val !== null) updateMapPosition(lat, val)
            }}
            className="w-full input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-mist uppercase tracking-wider">
              Geofence Radius
            </label>
            <span className="text-xs font-bold text-coral font-mono">{radiusMeters} meters</span>
          </div>
          <input
            type="number"
            min="10"
            max="2000"
            value={radiusMeters}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 50
              onChange({ lat, lng, radiusMeters: val, locationName })
            }}
            className="w-full input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors font-mono"
          />
        </div>
      </div>

      {/* Preset Radius Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-mist font-semibold">Quick Radius Presets:</span>
        {[30, 50, 100, 200, 500].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange({ lat, lng, radiusMeters: preset, locationName })}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
              radiusMeters === preset
                ? 'bg-coral text-ink font-bold shadow-md'
                : 'bg-ink/60 border border-hairline text-parchment hover:border-mist'
            }`}
          >
            {preset}m
          </button>
        ))}
      </div>
    </div>
  )
}
