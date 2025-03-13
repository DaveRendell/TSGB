import * as React from "react"
import CPU from "../../emulator/cpu/cpu"
import PictureProcessor from "../../emulator/graphics/pictureProcessor"

interface Props {
  cpu: CPU,
  borderEnabled: boolean,
}

export default function Display({ cpu, borderEnabled }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (canvas.current) {
      cpu.pictureProcessor.scanlineRenderer.canvas = canvas.current
    }
  }, [canvas])

  const screenClass = borderEnabled ? "screen-border" : "screen"

  return (
    <section>
      <canvas className={`${screenClass} pixelated`} width={borderEnabled ? 32 * 8 : 160} height={borderEnabled ? 28 * 8 : 144} ref={canvas} />
    </section>
  )
}
