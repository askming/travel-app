import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const PIN = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 22" width="14" height="22">
    <circle cx="7" cy="6" r="5.5" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
    <circle cx="7" cy="6" r="2" fill="white" opacity="0.6"/>
    <line x1="7" y1="11" x2="7" y2="21" stroke="#9f1239" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  iconSize: [14, 22],
  iconAnchor: [7, 22],
  popupAnchor: [0, -24],
})

function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length === 0) return
    const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 })
  }, [stops])
  return null
}

export default function WorldMap({ stops }) {
  return (
    <MapContainer center={[20, 10]} zoom={2} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} />
      {stops.map((stop, i) => (
        <Marker key={i} position={[stop.lat, stop.lng]} icon={PIN}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{stop.destination}</p>
              <p className="text-stone-500 text-xs mt-0.5">{stop.trips?.cover_emoji} {stop.trips?.title}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
