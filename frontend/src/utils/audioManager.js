// Global audio singleton — only one track plays at a time across the whole app.
// When a new track plays anywhere (TrackCard or ArtistPanel), the previous one
// is paused and its UI reset callback is called.
let _current = null // { audio: HTMLAudioElement, onStop: Function }

/**
 * Play a new audio URL.
 * Stops and notifies the UI of whatever was previously playing.
 * Returns the HTMLAudioElement so the caller can reference it for stopAudio().
 */
export function playAudio(url, onStop, onEnded) {
  if (_current) {
    _current.audio.pause()
    if (_current.onStop) _current.onStop()
    _current = null
  }

  const audio = new Audio(url)
  audio.volume = 0.7
  audio.onended = () => {
    _current = null
    if (onEnded) onEnded()
  }
  audio.play().catch(() => {})
  _current = { audio, onStop }
  return audio
}

/**
 * Stop audio by reference (UI-driven stop).
 * Does NOT call onStop — the caller is already handling its own UI reset.
 */
export function stopAudio(audio) {
  if (_current && _current.audio === audio) {
    _current.audio.pause()
    _current = null
  }
}
