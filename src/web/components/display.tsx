import * as React from "react"
import CPU from "../../emulator/cpu/cpu"
import PictureProcessor from "../../emulator/pictureProcessor"

interface Props {
  cpu: CPU
}

export default function Display({ cpu }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (canvas.current) {
      cpu.pictureProcessor.canvas = canvas.current
    }
  }, [canvas])

  return (
    <section>
      <canvas
        className="screen"
        width="160"
        height="144"
        ref={canvas}
      />
    </section>
  )
}