import { useSyncExternalStore } from 'react'

const query = '(max-width: 1000px)'
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const snapshot = () => window.matchMedia(query).matches
export const useCompactLayout = () => useSyncExternalStore(subscribe, snapshot, () => false)
