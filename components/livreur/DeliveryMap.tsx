'use client'

import { useEffect, useRef } from 'react'

export default function DeliveryMap({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    import('leaflet').then((L) => {
      if (!mapDivRef.current || mapRef.current) return
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapDivRef.current).setView([lat, lng], 16)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>Adresse client</b><br/>${address}`)
        .openPopup()
    })
    return () => {
      try { if (mapRef.current && (mapRef.current as any)._leaflet_id) mapRef.current.remove() } catch {}
      mapRef.current = null
    }
  }, [lat, lng, address])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapDivRef} className="w-full h-full" />
    </>
  )
}
