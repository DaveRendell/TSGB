import * as React from "react"
import { Sprite } from "../../../emulator/memory/sprite"
import { EmulatorMode } from "../../../emulator/emulator"
import { PaletteRam } from "../../../emulator/memory/registers/paletteRegisters"
import { PaletteDisplay } from "./paletteDisplay"

interface Props {
  sprite: Sprite,
  index: number,
  spriteSize: number,
  mode: EmulatorMode,
  palettes: PaletteRam,
  colours: number[][]
}

export function SpriteInfo({ sprite, index, spriteSize, mode, palettes, colours }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>()
  const requestRef = React.useRef<number>()
  const monoPalette = [sprite.pallette0, sprite.pallette1][sprite.monochromePalette]
  const colourPalette = palettes.scaledColours[sprite.colourPalette]

  const fillCanvas = () => {
    
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(8, spriteSize)
      for (let row = 0; row < spriteSize; row++) {
        for (let col = 0; col < 8; col++) {
          const pixelId = (row << 3) + col
          const pixel = sprite.rawPixelAt(
            row + sprite.y - 16,
            col + sprite.x - 8,
            spriteSize
          )
          if (pixel !== undefined) {
            const monoPalette = [sprite.pallette0, sprite.pallette1][sprite.monochromePalette]
            const colourPalette = palettes.scaledColours[sprite.colourPalette]
            let colour: number[]
            if (mode !== EmulatorMode.CGB) {
              colour = colours[monoPalette.map[pixel]]
            } else {
              colour = colourPalette[pixel]
            }
            imageData.data[(pixelId << 2) + 0] = colour[0]
            imageData.data[(pixelId << 2) + 1] = colour[1]
            imageData.data[(pixelId << 2) + 2] = colour[2]
            imageData.data[(pixelId << 2) + 3] = 255
          } else {
            imageData.data[(pixelId << 2) + 0] = 0
            imageData.data[(pixelId << 2) + 1] = 0
            imageData.data[(pixelId << 2) + 2] = 0
            imageData.data[(pixelId << 2) + 3] = 0
          }
        }
      }
      context.putImageData(imageData, 0, 0)
    }
    requestRef.current = requestAnimationFrame(fillCanvas)
  }

  React.useEffect(() => {
    fillCanvas()
    return () => cancelAnimationFrame(requestRef.current)
  }, [canvas.current])

  return (
    <tr>
      <td>{index}</td>
      <td>
        <canvas
          width="8"
          height={spriteSize}
          ref={canvas}
          className={`sprite-info-canvas-${spriteSize}`}
        />
      </td>
      <td>
        <code>0x{sprite.tile.toString(16).padStart(2, "0")} ({sprite.tile})</code>
      </td>
      <td><code>0x{sprite.x.toString(16).padStart(2, "0")} ({sprite.x})</code></td>
      <td><code>0x{sprite.y.toString(16).padStart(2, "0")} ({sprite.y})</code></td>
      <td>{sprite.priority ? "Low": "High"}</td>
      <td>{sprite.flipX ? "True" : "False"}</td>
      <td>{sprite.flipY ? "True" : "False"}</td>
      {mode !== EmulatorMode.CGB
        ? <>{sprite.monochromePalette} - <PaletteDisplay colours={monoPalette.map.map(c => colours[c])}/></>
        : <>{sprite.colourPalette} - <PaletteDisplay colours={colourPalette} /></>}
    </tr>
  )
}