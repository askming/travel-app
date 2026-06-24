import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

function NumberedIcon(number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#1c1917;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:system-ui;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [stops])
  return null
}

export default function TripMap({ stops }) {
  if (stops.length === 0) {
    return (
      <div className="h-80 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 text-sm">
        Add stops with coordinates to see the map
      </div>
    )
  }

  const center = [stops[0].lat, stops[0].lng]
  const polyline = stops.map(s => [s.lat, s.lng])

  return (
    <div className="h-96 rounded-xl overflow-hidden border border-stone-200">
      <MapContainer center={center} zoom={5} className="h-full w-full">
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds stops={stops} />
        {stops.length > 1 && <Polyline positions={polyline} pathOptions={{ color: '#1c1917', weight: 2, dashArray: '6 4' }} />}
        {stops.map((stop, i) => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={NumberedIcon(i + 1)}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{stop.destination}</p>
                {stop.date && <p className="text-stone-500">{new Date(stop.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                {stop.activities && <p className="mt-1">{stop.activities}</p>}
                {stop.hotel && <p className="text-stone-500">🏨 {stop.hotel}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
