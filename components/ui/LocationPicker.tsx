'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader, X, Navigation, CheckCircle } from 'lucide-react'

interface PickedLocation {
  lat: number
  lng: number
  address: string
}

interface Props {
  onSelect: (loc: PickedLocation) => void
  onClose: () => void
}

export default function LocationPicker({ onSelect, onClose }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  const [locating, setLocating] = useState(false)
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    let map: any

    import('leaflet').then((L) => {
      if (!mapDivRef.current || mapRef.current) return

      // Fix default marker icons (CDN)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      LRef.current = L
      map = L.map(mapDivRef.current).setView([6.1376, 1.2123], 13) // Lomé, Togo
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (e: any) => {
        placeMarker(L, map, e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      try {
        if (mapRef.current && (mapRef.current as any)._leaflet_id) {
          mapRef.current.remove()
        }
      } catch {}
      mapRef.current = null
    }
  }, [])

  const placeMarker = async (L: any, map: any, lat: number, lng: number) => {
    setCoords({ lat, lng })
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      marker.on('dragend', (e: any) => {
        const p = e.target.getLatLng()
        placeMarker(L, map, p.lat, p.lng)
      })
      markerRef.current = marker
    }
    map.panTo([lat, lng])
    await reverseGeocode(lat, lng)
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
        { headers: { 'User-Agent': 'LAMS-Boutique/1.0' } }
      )
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setGeocoding(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Géolocalisation non supportée'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setLocating(false)
        const L = LRef.current
        const map = mapRef.current
        if (L && map) {
          map.setView([latitude, longitude], 17)
          placeMarker(L, map, latitude, longitude)
        }
      },
      () => { setLocating(false); alert('Impossible d\'obtenir votre position GPS') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const confirm = () => {
    if (!coords || !address) return
    onSelect({ lat: coords.lat, lng: coords.lng, address })
  }

  return (
    <>
      {/* Inject Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
        <div className="w-full sm:max-w-xl bg-white flex flex-col rounded-t-xl sm:rounded-none" style={{ height: '85vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-lams-gold" />
              <p className="font-semibold text-lams-dark text-sm">Choisir votre adresse de livraison</p>
            </div>
            <button onClick={onClose} className="text-lams-gray hover:text-lams-dark"><X size={18} /></button>
          </div>

          {/* GPS button */}
          <div className="px-4 py-3 border-b border-lams-border flex-shrink-0">
            <button
              onClick={useCurrentLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 bg-lams-dark text-lams-cream py-2.5 text-xs tracking-widest font-medium hover:bg-lams-dark/90 transition-colors disabled:opacity-60"
            >
              {locating
                ? <><Loader size={14} className="animate-spin" /> LOCALISATION EN COURS...</>
                : <><Navigation size={14} className="text-lams-gold" /> UTILISER MA POSITION ACTUELLE (GPS)</>
              }
            </button>
            <p className="text-center text-[10px] text-lams-gray mt-2">ou cliquez sur la carte pour choisir un point</p>
          </div>

          {/* Map */}
          <div ref={mapDivRef} className="flex-1 w-full" />

          {/* Address + confirm */}
          <div className="p-4 border-t border-lams-border flex-shrink-0 space-y-3">
            {geocoding && (
              <div className="flex items-center gap-2 text-lams-gray text-xs">
                <Loader size={12} className="animate-spin" /> Récupération de l'adresse...
              </div>
            )}

            {address && !geocoding && (
              <div className="flex items-start gap-3 bg-lams-cream/60 p-3 border border-lams-border">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] tracking-widest text-lams-gray mb-0.5">ADRESSE SÉLECTIONNÉE</p>
                  <p className="text-sm text-lams-dark leading-relaxed">{address}</p>
                  {coords && (
                    <p className="text-[10px] text-lams-gray mt-1">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={confirm}
              disabled={!coords || geocoding}
              className="w-full btn-dark disabled:opacity-40 py-3"
            >
              CONFIRMER CETTE ADRESSE
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
