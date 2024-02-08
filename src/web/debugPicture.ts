import CPU from "../emulator/cpu/cpu"
import Memory from "../emulator/memory/memoryMap"

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
    return this.memory.vram.tiles0[tileId]
  }

  printTileSet(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("No canvas context")
    }
    canvas.width = 128
    canvas.height = 192
    const imageData = context.createImageData(128, 192)

    const baseAddress = 0x8000
    // 16 x 24 tiles
    // 1 row = 2 bytes. One tile = 16 bytes?

    for (let tile = 0; tile < 16 * 24; tile++) {
      const tileBaseAddress = baseAddress + 16 * tile
      const baseX = 8 * (tile % 16)
      const baseY = 8 * (tile >> 4)
      for (let row = 0; row < 8; row++) {
        const y = baseY + row
        const byte1 = this.memory.at(tileBaseAddress + 2 * row).byte
        const byte2 = this.memory.at(tileBaseAddress + 2 * row + 1).byte
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

  printTileset0(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("No canvas context")
    }
    canvas.width = 128
    canvas.height = 128
    const imageData = context.createImageData(128, 192)

    for (let i = 0; i < 0x100; i++) {
      const baseX = (i & 0b1111) << 3
      const baseY = (i >> 4) << 3
      for (let row = 0; row < 8; row++) {
        const rowData = this.memory.vram.tileset0(i, row).map((p) => COLOURS[p])
        const basePixelNumber = 128 * (baseY + row) + baseX
        for (let pixel = 0; pixel < 8; pixel++) {
          const colour = rowData[pixel]
          const pixelNumber = basePixelNumber + pixel
          imageData.data[4 * pixelNumber + 0] = colour[0]
          imageData.data[4 * pixelNumber + 1] = colour[1]
          imageData.data[4 * pixelNumber + 2] = colour[2]
          imageData.data[4 * pixelNumber + 3] = 255
        }
      }
    }

    context.putImageData(imageData, 0, 0)
  }

  printTileset1(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("No canvas context")
    }
    canvas.width = 128
    canvas.height = 128
    const imageData = context.createImageData(128, 192)

    for (let i = 0; i < 0x100; i++) {
      const baseX = (i & 0b1111) << 3
      const baseY = (i >> 4) << 3
      for (let row = 0; row < 8; row++) {
        const rowData = this.memory.vram.tileset1(i, row).map((p) => COLOURS[p])
        const basePixelNumber = 128 * (baseY + row) + baseX
        for (let pixel = 0; pixel < 8; pixel++) {
          const colour = rowData[pixel]
          const pixelNumber = basePixelNumber + pixel
          imageData.data[4 * pixelNumber + 0] = colour[0]
          imageData.data[4 * pixelNumber + 1] = colour[1]
          imageData.data[4 * pixelNumber + 2] = colour[2]
          imageData.data[4 * pixelNumber + 3] = 255
        }
      }
    }

    context.putImageData(imageData, 0, 0)
  }

  printBackgroundLayer(
    canvas: HTMLCanvasElement,
    layer: "window" | "background",
  ): void {
    const tilemapId =
      layer == "background"
        ? this.memory.registers.lcdControl.backgroundTilemap
        : this.memory.registers.lcdControl.windowTilemap
    const tileset = this.memory.registers.lcdControl.tileDataArea
    const pallete = this.memory.registers.backgroundPallete.map

    const context = canvas.getContext("2d")!

    const tiles: Set<number> = new Set()

    const tileMap: number[][] = []

    for (let y = 0; y < 32; y++) {
      const rowMap: number[] = []
      for (let x = 0; x < 32; x++) {
        let tileNumber = 32 * y + x
        let tileId =
          tilemapId == 0
            ? this.memory.vram.tilemap0(tileNumber)
            : this.memory.vram.tilemap1(tileNumber)

        tiles.add(tileId)
        rowMap.push(tileId)
      }
      tileMap.push(rowMap)
    }

    const tileImages = this.getTileData(tiles, context, tileset, pallete)

    tileMap.forEach((row, y) =>
      row.forEach((tileId, x) => {
        const tileData = tileImages[tileId]
        context.putImageData(tileData, x * 8, y * 8)
      }),
    )
  }

  getTileData(
    tileIds: Set<number>,
    context: CanvasRenderingContext2D,
    tileset: number,
    pallete: number[],
  ): ImageData[] {
    const tileImages: ImageData[] = []
    tileIds.forEach((tileId) => {
      const tileData = context.createImageData(8, 8)
      for (let row = 0; row < 8; row++) {
        let rowData =
          tileset == 1
            ? this.memory.vram.tileset0(tileId, row)
            : this.memory.vram.tileset1(tileId, row)

        for (let pixel = 0; pixel < 8; pixel++) {
          const baseIndex = (row * 8 + pixel) * 4
          const colour = COLOURS[pallete[rowData[pixel]]]
          tileData.data[baseIndex + 0] = colour[0]
          tileData.data[baseIndex + 1] = colour[1]
          tileData.data[baseIndex + 2] = colour[2]
          tileData.data[baseIndex + 3] = 255
        }
      }
      tileImages[tileId] = tileData
    })
    return tileImages
  }

  printSpriteLayer(canvas: HTMLCanvasElement): void {
    const sprites = this.memory.oam.sprites
    const pallette0 = this.memory.registers.objectPallete0.map
    const pallette1 = this.memory.registers.objectPallete1.map

    const context = canvas.getContext("2d")!
    context.clearRect(0, 0, 160, 144)

    const tilesP0 = new Set(
      sprites
        .filter((sprite) => sprite.monochromePalette == 0)
        .map((sprite) => sprite.tile),
    )
    const tilesP1 = new Set(
      sprites
        .filter((sprite) => sprite.monochromePalette == 1)
        .map((sprite) => sprite.tile),
    )
    const tileImagesP0 = this.getTileData(tilesP0, context, 1, pallette0)
    const tileImagesP1 = this.getTileData(tilesP1, context, 1, pallette1)

    sprites
      .filter((sprite) => sprite.priority)
      .forEach((sprite) => {
        const tileData =
          sprite.monochromePalette == 0
            ? tileImagesP0[sprite.tile]
            : tileImagesP1[sprite.tile]
        context.putImageData(tileData, sprite.x - 8, sprite.y - 16)
      })
    sprites
      .filter((sprite) => !sprite.priority)
      .forEach((sprite) => {
        const tileData =
          sprite.monochromePalette == 0
            ? tileImagesP0[sprite.tile]
            : tileImagesP1[sprite.tile]
        context.putImageData(tileData, sprite.x - 8, sprite.y - 16)
      })
    context.beginPath()
    context.lineWidth = 1
    context.strokeStyle = "red"
    context.rect(0, 0, 160, 144)
    context.stroke()
  }

  getSpriteInfo(): Sprite[] {
    return []
  }

  backgroundPallete(): number[][] {
    const backgroundPalletByte = this.memory.at(0xff47).byte

    return [
      COLOURS[(backgroundPalletByte >> 0) & 3],
      COLOURS[(backgroundPalletByte >> 2) & 3],
      COLOURS[(backgroundPalletByte >> 4) & 3],
      COLOURS[(backgroundPalletByte >> 6) & 3],
    ]
  }
}
