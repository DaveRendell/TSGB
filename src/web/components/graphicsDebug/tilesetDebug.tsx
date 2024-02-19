import * as React from "react"
import { VRAM } from "../../../emulator/memory/vram"
import { EmulatorMode } from "../../../emulator/emulator"

interface Props {
  vram: VRAM
  mode: EmulatorMode
}

const GREYSCALE = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

export function TilesetDebug({ vram, mode }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const [tilesetId, setTilesetId] = React.useState(0)
  const [bankId, setBankId] = React.useState(0)
  const [highlightedTileId, setHighlightedTileId] = React.useState<number | null>(null)

  const fillCanvas = () => {
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(128, 128)
      for (let tileRow = 0; tileRow < 16; tileRow++) {
        for (let tileCol = 0; tileCol < 16; tileCol++) {
          const tileId = (tileRow << 4) + tileCol
          for (let row = 0; row < 8; row++) {
            const y = (tileRow << 3) + row
            const rowData = vram.tileset(
              tilesetId,
              tileId,
              bankId,
              false,
              false,
              row
            )
            for (let col = 0; col < 8; col++) {
              const x = (tileCol << 3) + col
              const pixelId = (y << 7) + x
              const colour = GREYSCALE[rowData[col]]
              imageData.data[(pixelId << 2) + 0] = colour[0]
              imageData.data[(pixelId << 2) + 1] = colour[1]
              imageData.data[(pixelId << 2) + 2] = colour[2]
              imageData.data[(pixelId << 2) + 3] = 255
            }
          }
        }
      }
      context.putImageData(imageData, 0, 0)
      if (highlightedTileId !== null) {
        context.beginPath()
        context.lineWidth = 1
        context.strokeStyle = "red"
        context.rect(
          ((highlightedTileId % 16) << 3) - 1,
          (Math.floor(highlightedTileId / 16) << 3) - 1,
          10,
          10
        )
        context.stroke()
      }
    }
    requestAnimationFrame(fillCanvas)
  }

  const onMouseOver = (e: React.MouseEvent) => {
    const rect = canvas.current.getBoundingClientRect()
    const tileRow = (e.clientY - rect.top) >> 4
    const tileCol = (e.clientX - rect.left) >> 4
    setHighlightedTileId((tileRow << 4) + tileCol)
  }

  React.useEffect(() => {
    fillCanvas()
  }, [canvas.current, tilesetId, bankId, highlightedTileId])

  return <div>
    <h3>Tileset</h3>
    <label htmlFor="tileset-select">Tileset ID:</label>
    <select id="tileset-select" value={tilesetId.toString()} onChange={e => setTilesetId(parseInt(e.target.value))}>
      <option id="0">0</option>
      <option id="1">1</option>
    </select>
    <br/>
    {
      mode === EmulatorMode.CGB && <>
        <label htmlFor="bank-select">VRAM bank:</label>
        <select id="bank-select" value={bankId.toString()} onChange={e => setBankId(parseInt(e.target.value))}>
          <option id="0">0</option>
          <option id="1">1</option>
        </select>
        <br/>
      </>
    }
    <canvas
      className="tileset-debug-canvas"
      ref={canvas}
      width="128"
      height="128"
      onMouseMove={onMouseOver}
      onMouseLeave={() => setHighlightedTileId(null)}
    />
    <br/>
    Tile ID: <code>{ highlightedTileId === null ? "-" : `0x${highlightedTileId.toString(16).padStart(2, "0")} (${highlightedTileId})`}</code>
  </div>
}