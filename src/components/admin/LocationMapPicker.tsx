'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Search,
  Crosshair,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
  Check,
} from 'lucide-react'

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
  const inlineMapContainerRef = useRef<HTMLDivElement>(null)
  const modalMapContainerRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inlineMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalMapRef = useRef<any>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inlineMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalMarkerRef = useRef<any>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inlineCircleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalCircleRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [parseStatus, setParseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Temporary state while in fullscreen modal
  const [modalLat, setModalLat] = useState<number | null>(lat)
  const [modalLng, setModalLng] = useState<number | null>(lng)
  const [modalRadius, setModalRadius] = useState<number>(radiusMeters)
  const [modalName, setModalName] = useState<string>(locationName)

  const currentLat = lat ?? 26.1121
  const currentLng = lng ?? 86.6069

  // Helper to parse google maps link or raw coordinates
  const parseLocationInput = (input: string): { lat: number; lng: number } | null => {
    if (!input || !input.trim()) return null
    const text = decodeURIComponent(input.trim())

    // 1. Raw coordinates format: "26.1121, 86.6069"
    const rawCoordsMatch = text.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/)
    if (rawCoordsMatch) {
      const pLat = parseFloat(rawCoordsMatch[1])
      const pLng = parseFloat(rawCoordsMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 2. @lat,lng in google maps URLs
    const atMatch = text.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/)
    if (atMatch) {
      const pLat = parseFloat(atMatch[1])
      const pLng = parseFloat(atMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 3. Query param ?q=lat,lng or ?ll=lat,lng
    const qMatch = text.match(/[?&](?:q|ll|query|loc|center)=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/)
    if (qMatch) {
      const pLat = parseFloat(qMatch[1])
      const pLng = parseFloat(qMatch[3])
      if (isValidCoord(pLat, pLng)) return { lat: pLat, lng: pLng }
    }

    // 4. geo:lat,lng
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
      const newLat = Number(result.lat.toFixed(6))
      const newLng = Number(result.lng.toFixed(6))
      onChange({
        lat: newLat,
        lng: newLng,
        radiusMeters,
        locationName: locationName || 'School Campus',
      })
      setParseStatus({
        type: 'success',
        message: `Extracted coordinates: ${newLat}, ${newLng}`,
      })
      updateInlineMapPosition(newLat, newLng)
    } else {
      setParseStatus({
        type: 'error',
        message: 'Could not extract coordinates. Please paste a valid Google Maps link or coordinates (e.g. 26.1121, 86.6069).',
      })
    }
  }

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    if (!window.L) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => setMapLoaded(true)
      script.onerror = () => setMapError('Failed to load interactive map engine.')
      document.body.appendChild(script)
    } else {
      setMapLoaded(true)
    }
  }, [])

  // Create custom marker icon
  const createMarkerIcon = (L: any) => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(241,145,125,0.3); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative; width:24px; height:24px; border-radius:50%; background:#F1917D; border:3px solid #0B0B10; box-shadow:0 0 14px rgba(241,145,125,0.9); display:flex; align-items:center; justify-content:center;">
            <div style="width:7px; height:7px; border-radius:50%; background:#0B0B10;"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  }

  // Update inline map
  const updateInlineMapPosition = useCallback((targetLat: number, targetLng: number) => {
    if (!inlineMapRef.current || !window.L) return
    inlineMapRef.current.setView([targetLat, targetLng], Math.max(inlineMapRef.current.getZoom(), 16))
    if (inlineMarkerRef.current) inlineMarkerRef.current.setLatLng([targetLat, targetLng])
    if (inlineCircleRef.current) {
      inlineCircleRef.current.setLatLng([targetLat, targetLng])
      inlineCircleRef.current.setRadius(radiusMeters)
    }
  }, [radiusMeters])

  // Initialize Inline Map
  useEffect(() => {
    if (!mapLoaded || !inlineMapContainerRef.current || inlineMapRef.current || !window.L) return

    try {
      const L = window.L
      const map = L.map(inlineMapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const icon = createMarkerIcon(L)
      const marker = L.marker([currentLat, currentLng], { draggable: true, icon }).addTo(map)
      const circle = L.circle([currentLat, currentLng], {
        color: '#F1917D',
        fillColor: '#F1917D',
        fillOpacity: 0.15,
        weight: 2,
        radius: radiusMeters,
      }).addTo(map)

      inlineMarkerRef.current = marker
      inlineCircleRef.current = circle
      inlineMapRef.current = map

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marker.on('drag', (e: any) => circle.setLatLng(e.latlng))
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
      console.error('Error initializing inline map:', e)
    }

    return () => {
      if (inlineMapRef.current) {
        inlineMapRef.current.remove()
        inlineMapRef.current = null
      }
    }
  }, [mapLoaded])

  // Sync inline radius circle
  useEffect(() => {
    if (inlineCircleRef.current) {
      inlineCircleRef.current.setRadius(radiusMeters)
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
        updateInlineMapPosition(userLat, userLng)
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
        updateInlineMapPosition(pLat, pLng)
      } else {
        setParseStatus({ type: 'error', message: 'Place not found. Try searching with city or landmark name.' })
      }
    } catch {
      setParseStatus({ type: 'error', message: 'Search failed. Please check network connection.' })
    } finally {
      setIsSearching(false)
    }
  }

  // Fullscreen Modal Map Handler
  const openFullscreenPicker = () => {
    setModalLat(lat ?? currentLat)
    setModalLng(lng ?? currentLng)
    setModalRadius(radiusMeters)
    setModalName(locationName)
    setIsFullscreen(true)
  }

  const closeFullscreenPicker = () => {
    setIsFullscreen(false)
    if (modalMapRef.current) {
      modalMapRef.current.remove()
      modalMapRef.current = null
    }
  }

  const confirmModalLocation = () => {
    onChange({
      lat: modalLat,
      lng: modalLng,
      radiusMeters: modalRadius,
      locationName: modalName,
    })
    if (modalLat !== null && modalLng !== null) {
      updateInlineMapPosition(modalLat, modalLng)
    }
    closeFullscreenPicker()
  }

  // Initialize Fullscreen Modal Map
  useEffect(() => {
    if (!isFullscreen || !modalMapContainerRef.current || modalMapRef.current || !window.L) return

    const timer = setTimeout(() => {
      try {
        const L = window.L
        const centerLat = modalLat ?? currentLat
        const centerLng = modalLng ?? currentLng

        const map = L.map(modalMapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 17,
          zoomControl: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)

        const icon = createMarkerIcon(L)
        const marker = L.marker([centerLat, centerLng], { draggable: true, icon }).addTo(map)
        const circle = L.circle([centerLat, centerLng], {
          color: '#F1917D',
          fillColor: '#F1917D',
          fillOpacity: 0.18,
          weight: 2,
          radius: modalRadius,
        }).addTo(map)

        modalMarkerRef.current = marker
        modalCircleRef.current = circle
        modalMapRef.current = map

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.on('drag', (e: any) => circle.setLatLng(e.latlng))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          setModalLat(Number(pos.lat.toFixed(6)))
          setModalLng(Number(pos.lng.toFixed(6)))
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.on('click', (e: any) => {
          const pos = e.latlng
          marker.setLatLng(pos)
          circle.setLatLng(pos)
          setModalLat(Number(pos.lat.toFixed(6)))
          setModalLng(Number(pos.lng.toFixed(6)))
        })
      } catch (e) {
        console.error('Error initializing fullscreen modal map:', e)
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      if (modalMapRef.current) {
        modalMapRef.current.remove()
        modalMapRef.current = null
      }
    }
  }, [isFullscreen])

  // Sync radius circle in modal
  useEffect(() => {
    if (modalCircleRef.current) {
      modalCircleRef.current.setRadius(modalRadius)
    }
  }, [modalRadius])

  const openGoogleMapsExternal = () => {
    const query = lat !== null && lng !== null ? `${lat},${lng}` : 'India'
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* ── Option A: Paste Google Maps Link or Raw Coordinates ── */}
      <div className="p-4 rounded-2xl bg-ink/50 border border-hairline space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-coral" />
            <h3 className="text-xs font-bold text-parchment uppercase tracking-wider">
              Option 1: Paste Google Maps Link / Location URL
            </h3>
          </div>
          <button
            type="button"
            onClick={openGoogleMapsExternal}
            className="text-[11px] text-mist hover:text-coral transition-colors flex items-center gap-1 font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            Open Google Maps
          </button>
        </div>
        <p className="text-xs text-mist leading-relaxed">
          Google Maps link (e.g. <code>https://maps.google.com/?q=26.1121,86.6069</code>), share URL, ya raw coordinates (<code>26.1121, 86.6069</code>) paste karein.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Paste Google Maps URL or 26.1121, 86.6069..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="flex-1 input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors font-mono"
          />
          <button
            type="button"
            onClick={handleLinkExtract}
            className="px-4 py-2.5 rounded-xl bg-veena-blue text-ink text-xs font-bold hover:bg-veena-blue/90 transition-colors flex items-center justify-center gap-1.5 shadow-md"
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
              Option 2: Interactive Map Picker
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-lg bg-coral/15 border border-coral/30 hover:bg-coral/25 text-coral text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Detecting...' : '📍 Use Current GPS'}
            </button>
            <button
              type="button"
              onClick={openFullscreenPicker}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-hairline hover:border-mist text-parchment text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-veena-blue" />
              Full Screen
            </button>
          </div>
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
            className="px-4 py-2 rounded-xl bg-ink border border-hairline text-parchment hover:border-mist text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Map Container */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-hairline bg-ink shadow-inner">
          <div ref={inlineMapContainerRef} className="w-full h-full z-0" />

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
          <div className="absolute bottom-2 left-2 z-10 bg-ink/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-hairline text-[11px] text-parchment shadow-lg pointer-events-none flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            <span>Click map or drag pin to set exact school gate</span>
          </div>

          {/* Fullscreen shortcut overlay button */}
          <button
            type="button"
            onClick={openFullscreenPicker}
            className="absolute top-2 right-2 z-10 bg-ink/90 backdrop-blur-md p-2 rounded-xl border border-hairline hover:border-coral text-parchment shadow-lg transition-colors"
            title="Expand Fullscreen Map"
          >
            <Maximize2 className="w-4 h-4 text-coral" />
          </button>
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
              if (val !== null && lng !== null) updateInlineMapPosition(val, lng)
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
              if (lat !== null && val !== null) updateInlineMapPosition(lat, val)
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
        <span className="text-xs text-mist font-semibold">Quick Presets:</span>
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

      {/* ─────────────────────────────────────────────────────────────
          FULLSCREEN INTERACTIVE MAP PICKER MODAL (UBER / RAPIDO STYLE)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-ink text-parchment"
          >
            {/* Top Navigation Bar */}
            <div className="p-4 bg-ink/90 backdrop-blur-md border-b border-hairline flex items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-parchment">Set School Geofence Location</h2>
                  <p className="text-xs text-mist font-mono">
                    {modalLat ? `${modalLat.toFixed(5)}, ${modalLng?.toFixed(5)}` : 'Pin not placed'} · Radius: {modalRadius}m
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeFullscreenPicker}
                  className="px-4 py-2 rounded-xl bg-ink border border-hairline text-mist hover:text-parchment hover:border-mist text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModalLocation}
                  className="px-5 py-2 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-[#E67E6B] transition-colors flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Confirm Location
                </button>
              </div>
            </div>

            {/* Main Map Canvas (Edge-to-Edge) */}
            <div className="relative flex-1 w-full h-full bg-ink">
              <div ref={modalMapContainerRef} className="w-full h-full z-0" />

              {/* Floating Center Guide Helper */}
              <div className="absolute top-4 left-4 z-10 max-w-sm bg-ink/85 backdrop-blur-md p-3.5 rounded-2xl border border-hairline shadow-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-coral">
                  <Layers className="w-4 h-4" />
                  <span>Pin Location</span>
                </div>
                <p className="text-mist leading-relaxed">
                  Map ko drag karein ya school gate par tap karke pin place karein. Circle school ka allowed radius area show kar raha hai.
                </p>
              </div>

              {/* GPS Float Button */}
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const uLat = Number(pos.coords.latitude.toFixed(6))
                      const uLng = Number(pos.coords.longitude.toFixed(6))
                      setModalLat(uLat)
                      setModalLng(uLng)
                      if (modalMapRef.current && window.L) {
                        modalMapRef.current.setView([uLat, uLng], 17)
                        if (modalMarkerRef.current) modalMarkerRef.current.setLatLng([uLat, uLng])
                        if (modalCircleRef.current) modalCircleRef.current.setLatLng([uLat, uLng])
                      }
                    },
                    (err) => alert(`GPS error: ${err.message}`),
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }}
                className="absolute top-4 right-4 z-10 p-3.5 bg-ink/90 backdrop-blur-md rounded-2xl border border-hairline hover:border-coral text-coral shadow-2xl transition-colors flex items-center gap-2 text-xs font-bold"
              >
                <Crosshair className="w-4 h-4" />
                <span>📍 My GPS</span>
              </button>

              {/* Floating Bottom Tuning Control Bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4">
                <div className="surface-card p-5 rounded-3xl border border-hairline shadow-2xl space-y-4 backdrop-blur-xl bg-ink/95">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist font-bold uppercase tracking-wider">Geofence Radius:</span>
                    <span className="text-coral font-mono font-bold text-sm">{modalRadius} meters</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="20"
                      max="1000"
                      step="10"
                      value={modalRadius}
                      onChange={(e) => setModalRadius(parseInt(e.target.value, 10))}
                      className="flex-1 accent-coral cursor-pointer"
                    />
                    <div className="flex gap-1.5">
                      {[30, 50, 100, 200].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setModalRadius(r)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                            modalRadius === r
                              ? 'bg-coral text-ink font-bold'
                              : 'bg-white/5 border border-hairline text-parchment hover:border-mist'
                          }`}
                        >
                          {r}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={confirmModalLocation}
                    className="w-full py-3.5 rounded-xl bg-coral text-ink font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-all shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Apply Location
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
