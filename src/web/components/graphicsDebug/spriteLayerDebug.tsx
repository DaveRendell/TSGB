import * as React from "react"
import { Emulator } from "../../../emulator/emulator"

interface Props {
  emulator: Emulator
}

export function SpriteLayerDebug({ emulator }: Props) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const requestRef = React.useRef<number>()

  const drawLayer = () => {
    const palletes = [
      emulator.memory.registers.objectPallete0,
      emulator.memory.registers.objectPallete1
    ]
    if (canvas.current) {
      const context = canvas.current.getContext("2d")!
      const imageData = context.createImageData(160, 144)
      const spriteSize = emulator.memory.registers.lcdControl.objectSize
      for (let scanline = 0; scanline < 144; scanline++) {
        const sprites = emulator.memory.oam.sprites
          .filter(sprite => {
            const intersect = sprite.scanlineIntersect(scanline)
            return intersect >= 0 && intersect < spriteSize
          })
        for (let column = 0; column < 160; column++) {
          let rawPixel = 0
          let palleteId = 0
          for (const sprite of sprites) {
            const newPixel = sprite.rawPixelAt(scanline, column, spriteSize)
            if (newPixel !== undefined) {
              rawPixel = newPixel
              palleteId = sprite.monochromePalette
            }
          }
          const pixelId = (scanline * 160) + column
          const palette = palletes[palleteId]
          const paletteColour = palette.map[rawPixel]
          const colour = emulator.pictureProcessor.scanlineRenderer.colours[paletteColour]
          imageData.data[(pixelId << 2) + 0] = colour[0]
          imageData.data[(pixelId << 2) + 1] = colour[1]
          imageData.data[(pixelId << 2) + 2] = colour[2]
          imageData.data[(pixelId << 2) + 3] = 255
        }
      }
      context.putImageData(imageData, 0, 0)
    }
    requestRef.current = requestAnimationFrame(drawLayer)
  }

  React.useEffect(() => {
    drawLayer()
    return () => cancelAnimationFrame(requestRef.current)
  }, [canvas.current])

  return <canvas
    className="sprite-layer-debug-canvas"
    ref={canvas}
    width={160}
    height={144}
  />
}