/** Tracks whether the viewport is at or below `breakpointPx` — used to switch away from
 * side-by-side layouts (like the markdown editor's split preview) that don't fit narrow screens. */
export function useIsMobile(breakpointPx = 640) {
  const isMobile = ref(false)

  if (import.meta.client) {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    isMobile.value = mql.matches

    const onChange = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
    }
    mql.addEventListener('change', onChange)
    onUnmounted(() => mql.removeEventListener('change', onChange))
  }

  return isMobile
}
