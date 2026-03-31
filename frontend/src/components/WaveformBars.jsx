export default function WaveformBars({ playing = false, color = '#0a0a0a' }) {
  if (!playing) {
    return (
      <div className="flex items-center gap-[3px] h-5">
        {[2, 4, 3, 5, 2].map((h, i) => (
          <div
            key={i}
            className="w-[3px]"
            style={{ height: `${h}px`, backgroundColor: color, opacity: 0.4 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-[3px] h-5">
      <div className="w-[3px] bg-primary animate-wave-1" style={{ backgroundColor: color }} />
      <div className="w-[3px] bg-primary animate-wave-2" style={{ backgroundColor: color }} />
      <div className="w-[3px] bg-primary animate-wave-3" style={{ backgroundColor: color }} />
      <div className="w-[3px] bg-primary animate-wave-4" style={{ backgroundColor: color }} />
      <div className="w-[3px] bg-primary animate-wave-5" style={{ backgroundColor: color }} />
    </div>
  )
}
