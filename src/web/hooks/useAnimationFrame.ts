import * as React from "react"

export default function useAnimationFrame(
  effect: React.EffectCallback,
  dependencies: React.DependencyList
) {
  const timeoutRef = React.useRef<number>(undefined)

  const onFrameComplete = () => {
    effect()
    timeoutRef.current = requestAnimationFrame(onFrameComplete)
  }

  React.useEffect(() => {
    onFrameComplete()

    return () => {
      if (timeoutRef.current) {
        cancelAnimationFrame(timeoutRef.current)
      }
    }
  }, [dependencies])
}