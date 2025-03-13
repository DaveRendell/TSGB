import * as React from "react"
import SuperDebug from "./superDebug"
import SuperEmulator from "../../../emulator/super/superEmulator"

interface Props {
  superEmulator: SuperEmulator
}

export default function BorderDebug({ superEmulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    canvas.current && superEmulator.drawBorder(canvas.current)
  }, [canvas.current])
  return <div>
    <canvas
      className="border-debug-canvas"
      width={32 * 8}
      height={28 * 8}
      ref={canvas}
    />
    { superEmulator.tilemap.map(entry => JSON.stringify(entry))}
  </div>
}