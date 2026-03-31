export default function ArtistsTab({ currentTracks, liftTracks, onExplore }) {
  // Collect unique artists from all tracks in this session
  const allTracks = [...(currentTracks || []), ...(liftTracks || [])]
  const seen = new Set()
  const artists = []
  for (const track of allTracks) {
    const artist = track.artists?.[0]
    if (artist?.id && !seen.has(artist.id)) {
      seen.add(artist.id)
      artists.push({
        ...artist,
        image_url: track.image_url, // use track art as fallback
      })
    }
  }

  if (artists.length === 0) {
    return (
      <div className="pt-16 pb-12 flex flex-col items-center justify-center gap-4 text-center">
        <span className="material-symbols-outlined text-zinc-700 text-6xl">person_search</span>
        <p className="text-zinc-600 text-xs uppercase tracking-widest">
          Inicia tu descubrimiento para ver artistas
        </p>
      </div>
    )
  }

  return (
    <div className="pt-10 pb-12">
      <p className="label-caps text-zinc-500 mb-6">Artistas en tu sesión</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {artists.map((artist) => (
          <button
            key={artist.id}
            onClick={() => onExplore({ artist, becauseLiked: null })}
            className="group flex flex-col items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left"
          >
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full aspect-square object-cover rounded-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
              />
            ) : (
              <div className="w-full aspect-square bg-zinc-800 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-500 text-4xl">person</span>
              </div>
            )}
            <span className="text-zinc-100 text-xs font-medium text-center w-full truncate">
              {artist.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
