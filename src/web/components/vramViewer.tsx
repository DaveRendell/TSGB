import * as React from "react"
import PPU, { Sprite } from "../../emulator/ppu"

interface Props {
  ppu: PPU
}



export function VramViewer({ ppu }: Props) {
  const tileSetCanvas = React.useRef<HTMLCanvasElement>(null)
  const backgroundCanvas = React.useRef<HTMLCanvasElement>(null)
  const [sprites, setSprites] = React.useState<Sprite[]>([])

  const update = () => {
    if (tileSetCanvas.current) {
      ppu.printTileSet(tileSetCanvas.current)
    }
    if (backgroundCanvas.current) {
      ppu.printBackgroundLayer(backgroundCanvas.current)
    }
    setSprites(ppu.getSpriteInfo())
  }

  const toColour = (values: number[]): string =>
    `#${values.map(x => x.toString(16).padStart(2, "0")).join("")}ff`

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
        <p>Pallette:
        {ppu.backgroundPallete().map(
          (colour, i) => <span
            className="pallete-block"
            style={{backgroundColor: toColour(colour)}}
          >{i}</span>)}</p>
        <canvas
          width="256"
          height="256"
          ref={backgroundCanvas}
        />
      </div>
      <div>
        <h3>Sprites</h3>
        <div className="flex-horizonally">
          <div>
            sprite 1-20
          </div>
          <div>
            sprite 21-40
          </div>
        </div>
      </div>
    </div>
  </section>)
}