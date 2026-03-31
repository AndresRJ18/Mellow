import { supabase } from '../lib/supabase'

export async function saveMoodSession(user, { mood_label, lectura, paleta, emotional_text }) {
  const { data, error } = await supabase
    .from('mood_sessions')
    .insert({
      user_id: user.id,
      mood_label,
      lectura,
      paleta,
      emotional_text,
    })
    .select('id')
    .single()

  if (error) { console.error('[supabase] saveMoodSession:', error.message); return null }
  return data
}

export async function saveLikedTrack(user, track) {
  const { error } = await supabase
    .from('liked_tracks')
    .upsert({
      user_id: user.id,
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artists?.[0]?.name ?? null,
      image_url: track.image_url ?? null,
      preview_url: track.preview_url ?? null,
      release_year: track.release_year ?? null,
    }, { onConflict: 'user_id,track_id' })

  if (error) console.error('[supabase] saveLikedTrack:', error.message)
}

export async function removeLikedTrack(user, trackId) {
  const { error } = await supabase
    .from('liked_tracks')
    .delete()
    .eq('user_id', user.id)
    .eq('track_id', trackId)

  if (error) console.error('[supabase] removeLikedTrack:', error.message)
}

export async function saveExportedPlaylist(user, { playlist_name, spotify_playlist_id, spotify_url, track_count, mood_session_id }) {
  const { error } = await supabase
    .from('exported_playlists')
    .insert({
      user_id: user.id,
      playlist_name,
      spotify_playlist_id,
      spotify_url,
      track_count,
      mood_session_id: mood_session_id ?? null,
    })

  if (error) console.error('[supabase] saveExportedPlaylist:', error.message)
}
