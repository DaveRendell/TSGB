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
  const windowCanvas = React.useRef<HTMLCanvasElement>(null)
  const spriteCanvas = React.useRef<HTMLCanvasElement>(null)
  const [sprites, setSprites] = React.useState<Sprite[]>([])
  const [sX, setSX] = React.useState(0)
  const [sY, setSY] = React.useState(0)
  const [wX, setWX] = React.useState(0)
  const [wY, setWY] = React.useState(0)

  const update = () => {
    setSX(ppu.memory.registers.scrollX.value)
    setSY(ppu.memory.registers.scrollY.value)
    setWX(ppu.memory.registers.windowX.value)
    setWY(ppu.memory.registers.windowY.value)
    if (tileSet0Canvas.current) {
      ppu.printTileset0(tileSet0Canvas.current)
    }
    if (tileSet1Canvas.current) {
      ppu.printTileset1(tileSet1Canvas.current)
    }
    if (backgroundCanvas.current) {
      ppu.printBackgroundLayer(backgroundCanvas.current, "background")
      const context = backgroundCanvas.current.getContext("2d")!
      context.beginPath()
      context.lineWidth = 1
      context.strokeStyle = "red"
      context.rect(sX, sY, 160, 144)
      context.rect(sX - 256, sY, 160, 144)
      context.rect(sX, sY - 256, 160, 144)
      context.rect(sX - 256, sY - 256, 160, 144)
      context.stroke()

    }
    if (windowCanvas.current) {
      ppu.printBackgroundLayer(windowCanvas.current, "window")
      const context = windowCanvas.current.getContext("2d")!
      context.beginPath()
      context.lineWidth = 1
      context.strokeStyle = "red"
      context.rect(-wX + 7, -wY, 160, 144)
      context.stroke()
    }
    if (spriteCanvas.current) {
      ppu.printSpriteLayer(spriteCanvas.current)
    }
    
    setSprites(ppu.getSpriteInfo())
  }

  React.useEffect(() => { update() }, [])

  const toColour = (values: number[]): string =>
    `#${values.map(x => x.toString(16).padStart(2, "0")).join("")}ff`

  return (<section>
    <button onClick={update}>Update</button>
    <div className="flex-horizontally">
      <div>
        <h3>Tile data</h3>
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
      <div>
        <h3>Background map</h3>
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
      <div>
        <h3>Window layer</h3>
        <canvas
          width="160"
          height="144"
          ref={windowCanvas}
        />
        <h3>Sprite layer</h3>
        <canvas
          width="160"
          height="144"
          ref={spriteCanvas}
        />
      </div>
      
    </div>
    <div>
      <h3>Sprites</h3>
      <div className="flex-horizontally">
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