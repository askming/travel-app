import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

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
        <CircleMarker
          key={i}
          center={[stop.lat, stop.lng]}
          radius={6}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#1c1917', fillOpacity: 0.85 }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{stop.destination}</p>
              <p className="text-stone-500 text-xs mt-0.5">{stop.trips?.cover_emoji} {stop.trips?.title}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
