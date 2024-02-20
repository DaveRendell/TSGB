import * as React from "react"
import { Emulator, EmulatorMode } from "../../../emulator/emulator"

interface Props {
  emulator: Emulator
}

export function BackgroundDebug({ emulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const requestRef = React.useRef<number>()
  const [highlightedTileId, setHighlightedTileId] = React.useState<number | null>(null)

  const vram = emulator.memory.vram
  const lcdControl = emulator.memory.registers.lcdControl

  const fillCanvas = () => {
    
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(256, 256)
      for (let tileRow = 0; tileRow < 32; tileRow++) {
        for (let tileCol = 0; tileCol < 32; tileCol++) {
          const tileMapIndex = (tileRow << 5) + tileCol
          const tileId = vram.tilemap(lcdControl.backgroundTilemap, tileMapIndex)
          const attributes = vram.tileAttributes[(lcdControl.backgroundTilemap << 10) + tileMapIndex]
          for (let row = 0; row < 8; row++) {
            const y = (tileRow << 3) + row
            const rowData = vram.tileset(
              lcdControl.backgroundTilemap,
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
              if (emulator.mode === EmulatorMode.DMG) {
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
      const sX = emulator.memory.registers.scrollX.byte
      const sY = emulator.memory.registers.scrollY.byte
      context.beginPath()
      context.lineWidth = 1
      context.strokeStyle = "red"
      context.rect(sX - 1, sY - 1, 162, 146)
      context.rect(sX - 257, sY - 1, 162, 146)
      context.rect(sX - 1, sY - 257, 162, 146)
      context.rect(sX - 257, sY - 257, 162, 146)
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
  }

  return (
    <div>
      <h3>Background layer</h3>
      <canvas
        className="background-debug-canvas"
        ref={canvas}
        width="256"
        height="256"
        onMouseMove={onMouseOver}
        onMouseLeave={() => setHighlightedTileId(null)}
      />
    </div>
  )
}