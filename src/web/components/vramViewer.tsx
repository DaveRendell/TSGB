import * as React from "react"
import PPU, { Sprite } from "../../emulator/ppu"
import { valueDisplay } from "../../helpers/displayHexNumbers"

interface Props {
  ppu: PPU
}



export function VramViewer({ ppu }: Props) {
  const tileSet0Canvas = React.useRef<HTMLCanvasElement>(null)
  const tileSet1Canvas = React.useRef<HTMLCanvasElement>(null)
  const backgroundCanvas = React.useRef<HTMLCanvasElement>(null)
  const [sprites, setSprites] = React.useState<Sprite[]>([])
  const [sX, setSX] = React.useState(0)
  const [sY, setSY] = React.useState(0)

  const update = () => {
    if (tileSet0Canvas.current) {
      ppu.printTileset0(tileSet0Canvas.current)
    }
    if (tileSet1Canvas.current) {
      ppu.printTileset1(tileSet1Canvas.current)
    }
    if (backgroundCanvas.current) {
      ppu.printBackgroundLayer(backgroundCanvas.current, 1)
    }
    setSX(ppu.memory.registers.scrollX.value)
    setSY(ppu.memory.registers.scrollY.value)
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
        <div className="flex-horizonally">
          <div>
            <h4>Tileset 0</h4>
              <canvas
                width="128"
                height="128"
                ref={tileSet0Canvas}
              />
          </div>
          <div>
            <h4>Tileset 1</h4>
              <canvas
                width="128"
                height="128"
                ref={tileSet1Canvas}
              />
          </div>
        </div>
      </div>
      <div>
        <h3>Background layer</h3>
        <p>Pallette:
        {ppu.backgroundPallete().map(
          (colour, i) => <span
            className="pallete-block"
            style={{backgroundColor: toColour(colour)}}
          >{i}</span>)}</p>
        <p>sX: {valueDisplay(sX)}, sY: {valueDisplay(sY)}</p>
        <canvas
          width="256"
          height="256"
          ref={backgroundCanvas}
        />
      </div>
      
    </div>
    <div>
      <h3>Sprites</h3>
      <div className="flex-horizonally">
        <div>
          sprite 1-20
        </div>
        <div>
          sprite 11-20
        </div>
        <div>
          sprite 21-30
        </div>
        <div>
          sprite 31-40
        </div>
      </div>
    </div>
  </section>)
}