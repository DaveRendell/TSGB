import * as React from "react"
import { Emulator } from "../../emulator/emulator"
import { MessageType } from "../../emulator/graphics/message"

interface Props {
  emulator: Emulator
}

export default function Display({ emulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (canvas.current) {
      console.log("Updating canvas")
      const offscreen = canvas.current.transferControlToOffscreen()
      emulator.renderWorker.postMessage({
        type: MessageType.SetCanvas,
        canvas: offscreen
      }, [offscreen])
    }
  }, [canvas])

  return (
    <section>
      <canvas className="screen" width="160" height="144" ref={canvas} moz-opaque="true" />
    </section>
  )
}
