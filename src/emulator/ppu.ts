import CPU from "./cpu";
import Memory from "./memory";

const COLOURS = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

const TILESET_BASE_ADDRESS = 0x8000

type Tile = number[][]

export interface Sprite {
  id: number
  x: number
  y: number
  flipX: boolean
  flipy: boolean
}

export default class PPU {
  cpu: CPU
  memory: Memory

  constructor(cpu: CPU) {
    this.cpu = cpu
    this.memory = cpu.memory
  }

  getTile(tileId: number): Tile {
    const tileData: Tile = []
    const tileBaseAddress = TILESET_BASE_ADDRESS + 16 * tileId
    for (let row = 0; row < 8; row++) {
      const rowData: number[] = []
      const byte1 = this.memory.at(tileBaseAddress + 2 * row).value
      const byte2 = this.memory.at(tileBaseAddress + 2 * row + 1).value
      for (let bit = 7; bit >= 0; bit--) {
        const bit1 = (byte1 >> bit) & 1
        const bit2 = (byte2 >> bit) & 1
        const pixelValue = bit1 + (bit2 << 1)

        rowData.push(pixelValue)
      }
      tileData.push(rowData)
    }
    return tileData
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
        const byte1 = this.memory.at(tileBaseAddress + 2 * row).value
        const byte2 = this.memory.at(tileBaseAddress + 2 * row + 1).value
        for (let bit = 7; bit >= 0; bit--) {
          const x = baseX + 7 - bit
          const pixelNumber = y * 128 + x
          const bit1 = (byte1 >> bit) & 1
          const bit2 = (byte2 >> bit) & 1
          const pixelValue = bit1 + (bit2 << 1)
          const colour = COLOURS[pixelValue]
          imageData.data[4 * pixelNumber + 0] = colour[0]
          imageData.data[4 * pixelNumber + 1] = colour[1]
          imageData.data[4 * pixelNumber + 2] = colour[2]
          imageData.data[4 * pixelNumber + 3] = 255
        }
      }
    }

    context.putImageData(imageData, 0, 0)
  }

  // Load BIOS to 0x0055 to test
  printBackgroundLayer(canvas: HTMLCanvasElement): void {
    // Tilemap 1: 0x9800 - 0x9BFF, so 256 bytes
    // once byte is one tile surely?
    const context = canvas.getContext("2d")
    if (!context) { throw new Error("No canvas context") }
    canvas.width = 256
    canvas.height = 256

    const backgroundPalletByte = this.memory.at(0xFF47).value

    const pallet: number[][] = [
      COLOURS[(backgroundPalletByte >> 0) & 3],
      COLOURS[(backgroundPalletByte >> 2) & 3],
      COLOURS[(backgroundPalletByte >> 4) & 3],
      COLOURS[(backgroundPalletByte >> 6) & 3],
    ]

    for (let j = 0; j < 32; j++) {
      const baseY = j * 8
      for (let i = 0; i < 32; i++) {
        const baseX = i * 8
        const tileMapAddress = 0x9800 + i + (j * 32)
        const tileNumber = this.memory.at(tileMapAddress).value
        const tileData = this.getTile(tileNumber)
        const imageData = context.createImageData(8, 8)
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            const pixelNumber = (y * 8) + x
            const pixelValue = tileData[y][x]
            const colour = pallet[pixelValue]
            imageData.data[4 * pixelNumber + 0] = colour[0]
            imageData.data[4 * pixelNumber + 1] = colour[1]
            imageData.data[4 * pixelNumber + 2] = colour[2]
            imageData.data[4 * pixelNumber + 3] = 255
          }
        }
        context.putImageData(imageData, baseX, baseY)
      }
    }
  }

  getSpriteInfo(): Sprite[] {
    return []
  }

  backgroundPallete(): number[][] {
    const backgroundPalletByte = this.memory.at(0xFF47).value

    return [
      COLOURS[(backgroundPalletByte >> 0) & 3],
      COLOURS[(backgroundPalletByte >> 2) & 3],
      COLOURS[(backgroundPalletByte >> 4) & 3],
      COLOURS[(backgroundPalletByte >> 6) & 3],
    ]
  }
}