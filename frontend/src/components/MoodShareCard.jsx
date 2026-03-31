import { forwardRef } from 'react'

const MoodShareCard = forwardRef(function MoodShareCard(
  { mood_label, lectura, paleta = ['#8eff71', '#0a0a0a', '#1a1919'], likedTracks = [] },
  ref
) {
  const accent = paleta[0] || '#8eff71'
  const p1 = paleta[1] || paleta[0] || '#0a0a0a'
  const p2 = paleta[2] || paleta[0] || '#1a1919'
  const moodFontSize = (mood_label || '').length > 10 ? '52px' : '72px'
  const tracks = likedTracks.slice(0, 4)
  const now = new Date()
  const month = now.toLocaleString('es', { month: 'short' })
  const year = now.getFullYear()

  const cardStyle = {
    width: '360px',
    height: '640px',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    background: `
      linear-gradient(160deg, ${accent}22 0%, transparent 40%),
      linear-gradient(340deg, ${p1}18 0%, transparent 55%),
      linear-gradient(200deg, ${p2}12 0%, transparent 60%),
      #09090b
    `,
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
  }

  return (
    <div ref={ref} style={cardStyle}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <span style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic',
          color: '#ffffff',
          fontSize: '18px',
          letterSpacing: '-0.01em',
        }}>
          mellow
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[accent, p1, p2].map((c, i) => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c, opacity: 0.85 }} />
          ))}
        </div>
      </div>

      {/* Mood label */}
      <h1 style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontStyle: 'italic',
        fontSize: moodFontSize,
        lineHeight: '1',
        color: accent,
        letterSpacing: '-0.02em',
        margin: '0 0 16px 0',
        wordBreak: 'break-word',
      }}>
        {mood_label || 'mood'}
      </h1>

      {/* Lectura */}
      <p style={{
        color: '#a1a1aa',
        fontSize: '13px',
        lineHeight: '1.5',
        margin: '0 0 24px 0',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {lectura}
      </p>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#ffffff18', marginBottom: '20px' }} />

      {/* Track list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tracks.length === 0 ? (
          <p style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic',
            color: '#52525b',
            fontSize: '16px',
            textAlign: 'center',
            marginTop: '24px',
          }}>
            Tu estado, sin filtros.
          </p>
        ) : (
          tracks.map((track) => (
            <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {track.image_url ? (
                <img
                  src={track.image_url}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', filter: 'grayscale(0.2)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#27272a', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#f4f4f5', fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.name}
                </p>
                <p style={{ color: '#71717a', fontSize: '11px', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.artists?.[0]?.name}
                  {track.release_year ? ` · ${track.release_year}` : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #ffffff10',
      }}>
        <span style={{ color: '#3f3f46', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
          mellow.app
        </span>
        <span style={{ color: '#3f3f46', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {month} {year}
        </span>
      </div>
    </div>
  )
})

export default MoodShareCard
