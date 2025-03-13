import * as React from "react"
import SuperEmulator from "../../../emulator/super/superEmulator"

interface Props {
  superEmulator: SuperEmulator
}

export function SuperTilesDebug({ superEmulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const [highlightedTileId, setHighlightedTileId] = React.useState<number | null>(null)
  const requestRef = React.useRef<number>()

  const fillCanvas = () => {
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(128, 128)

      for (let tileRow = 0; tileRow < 16; tileRow++) {
        for (let tileCol = 0; tileCol < 16; tileCol++) {
          const tileId = (tileRow << 4) + tileCol
          for (let row = 0; row < 8; row++) {
            const y = (tileRow << 3) + row
            const rowData = superEmulator.borderTiles.tiles[tileId][row]
            for (let col = 0; col < 8; col++) {
              const x = (tileCol << 3) + col
              const pixelId = (y << 7) + x
              const colourValue = 15 - rowData[col] << 4
              imageData.data[(pixelId << 2) + 0] = colourValue
              imageData.data[(pixelId << 2) + 1] = colourValue
              imageData.data[(pixelId << 2) + 2] = colourValue
              imageData.data[(pixelId << 2) + 3] = 255
            }
          }
        }
      }
      
      context.putImageData(imageData, 0, 0)
      if (highlightedTileId !== null) {
        context.beginPath()
        context.lineWidth = 1
        context.strokeStyle = "blue"
        context.rect(
          ((highlightedTileId % 16) << 3) - 1,
          (Math.floor(highlightedTileId / 16) << 3) - 1,
          10,
          10
        )
        context.stroke()
      }
    }
    requestRef.current = requestAnimationFrame(fillCanvas)
  }

  const onMouseOver = (e: React.MouseEvent) => {
      const rect = canvas.current.getBoundingClientRect()
      const tileRow = (e.clientY - rect.top) >> 4
      const tileCol = (e.clientX - rect.left) >> 4
      setHighlightedTileId((tileRow << 4) + tileCol)
    }

  React.useEffect(() => {
    fillCanvas()
    return () => cancelAnimationFrame(requestRef.current)
  }, [canvas.current, highlightedTileId])

  return <>
    <canvas
      className="super-tileset-debug-canvas"
      ref={canvas}
      width="128"
      height="128"
      onMouseMove={onMouseOver}
      onMouseLeave={() => setHighlightedTileId(null)}
    />
    <br/>
    {highlightedTileId !== null && <div>
      Tile ID: <code>{highlightedTileId.toString(16).padStart(2, "0")} ({highlightedTileId})</code>
    </div>}
  </>
}