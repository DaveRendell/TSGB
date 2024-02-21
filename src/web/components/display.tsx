import * as React from "react"
import CPU from "../../emulator/cpu/cpu"
import PictureProcessor from "../../emulator/graphics/pictureProcessor"

interface Props {
  cpu: CPU
}

export default function Display({ cpu }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (canvas.current) {
      cpu.pictureProcessor.scanlineRenderer.canvas = canvas.current
    }
  }, [canvas])

  return (
    <section>
      <canvas className="screen pixelated" width="160" height="144" ref={canvas} />
    </section>
  )
}
