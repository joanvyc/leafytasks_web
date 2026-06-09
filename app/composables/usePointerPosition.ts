// Tracks the latest pointer position with a single shared listener, so hover
// cards (and anything else) can anchor to where the cursor actually is rather
// than to a wide trigger element. Client-only; stays at {0,0} during SSR.
const position = reactive({ x: 0, y: 0 })
let listening = false

export function usePointerPosition() {
  if (import.meta.client && !listening) {
    listening = true
    window.addEventListener('pointermove', (e) => {
      position.x = e.clientX
      position.y = e.clientY
    }, { passive: true })
  }
  return position
}
