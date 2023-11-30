import * as React from "react"
import PPU from "../../emulator/ppu"

interface Props {
  ppu: PPU
}

export function VramViewer({ ppu }: Props) {
  const tileSetCanvas = React.useRef<HTMLCanvasElement>(null)
  const backgroundCanvas = React.useRef<HTMLCanvasElement>(null)

  const update = () => {
    if (tileSetCanvas.current) {
      ppu.printTileSet(tileSetCanvas.current)
    }
    if (backgroundCanvas.current) {
      ppu.printBackgroundLayer(backgroundCanvas.current)
    }
  }

  return (<section>
    <h2> VRAM Viewer</h2>
    <button onClick={update}>Update</button>
    <div className="flex-horizonally">
      <div>
        <h3>Tile data</h3>
        <canvas
          width="128"
          height="192"
          ref={tileSetCanvas}
        />
      </div>
      <div>
        <h3>Background layer</h3>
        <canvas
          width="256"
          height="256"
          ref={backgroundCanvas}
        />
      </div>
    </div>
  </section>)
}