import * as React from "react"
import { Emulator, EmulatorMode } from "../../../emulator/emulator"
import { PaletteDisplay } from "./paletteDisplay"
import { TileAttributes } from "../../../emulator/memory/tileAttributes"

interface Props {
  emulator: Emulator
}

export function WindowDebug({ emulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const requestRef = React.useRef<number>()
  const [highlightedTileId, setHighlightedTileId] = React.useState<number | null>(null)

  const lcdControl = emulator.memory.registers.lcdControl
  const [tilemapId, setTilemapId] = React.useState(lcdControl.windowTilemap)
  const [tilesetId, setTilesetId] = React.useState(lcdControl.tileDataArea)
  const [isEnabled, setIsEnabled] = React.useState(lcdControl.backgroundWindowDisplay && lcdControl.windowEnabled)
  const [bgPalette, setBgPalette] = React.useState(
    emulator.memory.registers.backgroundPallete.map.map(x =>
      emulator.pictureProcessor.scanlineRenderer.colours[x]))
  const [attributes, setAttributes] = React.useState<TileAttributes>(undefined)

  React.useEffect(() => {
    const ref = setInterval(() => {
      setTilemapId(lcdControl.windowTilemap)
      setTilesetId(lcdControl.tileDataArea)
      setIsEnabled(lcdControl.backgroundWindowDisplay && lcdControl.windowEnabled)
      setBgPalette(emulator.memory.registers.backgroundPallete.map.map(x =>
        emulator.pictureProcessor.scanlineRenderer.colours[x]))
    }, 32)
    return () => clearInterval(ref)
  })

  const vram = emulator.memory.vram

  const fillCanvas = () => {
    
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(256, 256)
      for (let tileRow = 0; tileRow < 32; tileRow++) {
        for (let tileCol = 0; tileCol < 32; tileCol++) {
          const tileMapIndex = (tileRow << 5) + tileCol
          const tileId = vram.tilemap(lcdControl.windowTilemap, tileMapIndex)
          const attributes = vram.tileAttributes[(lcdControl.windowTilemap << 10) + tileMapIndex]
          for (let row = 0; row < 8; row++) {
            const y = (tileRow << 3) + row
            const rowData = vram.tileset(
              lcdControl.tileDataArea,
              tileId,
              attributes.bank,
              attributes.xFlip,
              attributes.yFlip,
              row
            )
            for (let col = 0; col < 8; col++) {
              const x = (tileCol << 3) + col
              const pixelId = (y << 8) + x
              let colour: number[]
              if (emulator.mode !== EmulatorMode.CGB) {
                colour = emulator.pictureProcessor.scanlineRenderer.colours[rowData[col]]
              } else {
                colour = emulator.memory.registers.backgroundPalettes.scaledColours[attributes.palette][rowData[col]]
              }
              imageData.data[(pixelId << 2) + 0] = colour[0]
              imageData.data[(pixelId << 2) + 1] = colour[1]
              imageData.data[(pixelId << 2) + 2] = colour[2]
              imageData.data[(pixelId << 2) + 3] = 255
            }
          }
        }
      }
      context.putImageData(imageData, 0, 0)
      // Draw screen position
      const wX = emulator.memory.registers.windowX.byte
      const wY = emulator.memory.registers.windowY.byte
      context.beginPath()
      context.lineWidth = 1
      context.strokeStyle = "red"
      context.rect(6 - wX, - (wY + 1), 162, 146)
      context.stroke()
      // Draw highlighted tile
      if (highlightedTileId !== null) {
        context.beginPath()
        context.lineWidth = 1
        context.strokeStyle = "blue"
        context.rect(
          ((highlightedTileId % 32) << 3) - 1,
          (Math.floor(highlightedTileId / 32) << 3) - 1,
          10,
          10
        )
        context.stroke()
      }
    }
    requestRef.current = requestAnimationFrame(fillCanvas)
  }

  React.useEffect(() => {
    fillCanvas()
    return () => cancelAnimationFrame(requestRef.current)
  }, [canvas.current, highlightedTileId])

  const onMouseOver = (e: React.MouseEvent) => {
    const rect = canvas.current.getBoundingClientRect()
    const tileRow = (e.clientY - rect.top) >> 4
    const tileCol = (e.clientX - rect.left) >> 4
    setHighlightedTileId((tileRow << 5) + tileCol)
    setAttributes(vram.tileAttributes[(lcdControl.windowTilemap << 10) + (tileRow << 5) + tileCol])
  }


  return (
    <div>
      <h3>Window layer</h3>
      Tilemap: {tilemapId}<br/>
      Tileset: {tilesetId}<br/>
      Enabled: {isEnabled ? "True" : "False"}<br/>
      {emulator.mode !== EmulatorMode.CGB && <>Palette: <PaletteDisplay colours={bgPalette} /><br/></>}
      <br/>
      <canvas
        className="background-debug-canvas"
        ref={canvas}
        width="256"
        height="256"
        onMouseMove={onMouseOver}
        onMouseLeave={() => setHighlightedTileId(null)}
      />
      <div className="tilemap-info">
        {
        (highlightedTileId !== null) && <>
          Tilemap ID: <code>0x{highlightedTileId.toString(16).padStart(2, "0")} ({highlightedTileId})</code><br/>
          Tile ID: <code>0x{vram.tilemap(lcdControl.windowTilemap, highlightedTileId).toString(16).padStart(2, "0")} ({vram.tilemap(lcdControl.backgroundTilemap, highlightedTileId)})</code><br/>
          { emulator.mode == EmulatorMode.CGB && <>
            Flip X: {attributes.xFlip ? "True" : "False"}<br/>
            Flip Y: {attributes.yFlip ? "True" : "False"}<br/>
            Priority: {attributes.priority ? "True" : "False"}<br/>
            Tile bank: {attributes.bank}<br/>
            Palette: {attributes.palette} - <PaletteDisplay
              colours={emulator.memory.registers.backgroundPalettes.scaledColours[attributes.palette]} /><br/>
          </>
          }
        </>
      }
      </div>
      

    </div>
  )
}