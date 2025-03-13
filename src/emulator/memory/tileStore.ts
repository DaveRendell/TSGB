type Tile = number[][]

export class TileStore {
  size: number
  bitDepth: number
  tiles: Tile[]
  flippedTiles: Tile[]

  constructor(size: number, bitDepth: number = 2) {
    this.size = size
    this.bitDepth = bitDepth
    this.clearTiles()
  }

  writeByte(offsetAddress: number, value: number): void {
    const bytesPerTile = 8 * this.bitDepth
    const tileNumber = Math.floor(offsetAddress / bytesPerTile)

    // Bit planes grouped in pairs
    const bitPlaneId = (offsetAddress % bytesPerTile) >> 4

    const rowNumber = ((offsetAddress % bytesPerTile) - (bitPlaneId << 4)) >> 1

    const bitToSet = (bitPlaneId << 1) + (offsetAddress & 1)

    for (let i = 0; i < 8; i++) {
      const setMask = 1 << bitToSet
      const unsetMask = ~setMask
      if (value & 1) {
        this.tiles[tileNumber][rowNumber][7 - i] |= setMask
        this.flippedTiles[tileNumber][rowNumber][i] |= setMask
      } else {
        this.tiles[tileNumber][rowNumber][7 - i] &= unsetMask
        this.flippedTiles[tileNumber][rowNumber][i] &= unsetMask
      }
      value >>= 1
    }
  }

  readRow(
    tileNumber: number,
    rowNumber: number,
    xFlip: boolean = false,
    yFlip: boolean = false,
  ): number[] {
    rowNumber = yFlip ? 7 - rowNumber : rowNumber

    return (xFlip ? this.flippedTiles : this.tiles)[tileNumber][rowNumber]
  }

  clearTiles(): void {
    this.tiles = [...new Array(this.size)]
      .map(() => [...new Array(8)]
        .map(() =>[...new Array(8)].map(() => 0)))
    this.flippedTiles = [...new Array(this.size)]
      .map(() => [...new Array(8)]
        .map(() => [...new Array(8)].map(() => 0)))
  }
}