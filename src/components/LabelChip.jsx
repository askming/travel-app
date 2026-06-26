const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
]

export function labelColor(label) {
  let h = 0
  for (let i = 0; i < label.length; i++) h = ((h << 5) - h + label.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

export default function LabelChip({ label, onClick, active }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${labelColor(label)} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${active ? 'ring-2 ring-offset-1 ring-current' : ''}`}
    >
      {label}
    </span>
  )
}
