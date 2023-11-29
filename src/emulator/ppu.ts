import CPU from "./cpu";
import Memory from "./memory";

const COLOURS = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

export default class PPU {
  cpu: CPU
  memory: Memory

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
  }

  printTileSet(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d")
    if (!context) { throw new Error("No canvas context") }
    canvas.width = 128
    canvas.height = 192
    const imageData = context.createImageData(128, 192)

    const baseAddress = 0x8000
    // 16 x 24 tiles
    // 1 row = 2 bytes. One tile = 16 bytes?

    for (let tile = 0; tile < 16*24; tile++) {
      const tileBaseAddress = baseAddress + 16 * tile
      const baseX = 8 * (tile % 16)
      const baseY = 8 * (tile >> 4)
      for (let row = 0; row < 8; row++) {
        const y = baseY + row
        const byte1 = this.memory.at(tileBaseAddress + 2 * row).read()
        const byte2 = this.memory.at(tileBaseAddress + 2 * row + 1).read()
        for (let bit = 7; bit >= 0; bit--) {
          const x = baseX + 7 - bit
          const pixelNumber = y * 128 + x
          const bit1 = (byte1 >> bit) & 1
          const bit2 = (byte2 >> bit) & 1
          const pixelValue = bit1 + (bit2 << 1)
          const colour = COLOURS[pixelValue]
          if (tile === 25) {
            console.log({x, y, bit1, bit2, pixelValue, pixelNumber, colour})
          }
          imageData.data[4 * pixelNumber + 0] = colour[0]
          imageData.data[4 * pixelNumber + 1] = colour[1]
          imageData.data[4 * pixelNumber + 2] = colour[2]
          imageData.data[4 * pixelNumber + 3] = 255
        }
      }
    }

    context.putImageData(imageData, 0, 0)
  }

  printBackgroundLayer(canvas: HTMLCanvasElement, tiles: HTMLCanvasElement): void {
    // Tilemap 1: 0x9800 - 0x9BFF, so 256 bytes
    // once byte is one tile surely?
    const context = canvas.getContext("2d")
    if (!context) { throw new Error("No canvas context") }
    canvas.width = 256
    canvas.height = 256

  }
}