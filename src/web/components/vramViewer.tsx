import * as React from "react"
import PPU from "../../emulator/ppu"

interface Props {
  ppu: PPU
}

export function VramViewer({ ppu }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const update = () => {
    if (canvasRef.current) {
      ppu.printTileSet(canvasRef.current)
    }
  }

  return (<section>
    <h2> VRAM Viewer</h2>
    <button onClick={update}>Update</button>
    <canvas
      width="128"
      height="192"
      ref={canvasRef}
    />
  </section>)
}