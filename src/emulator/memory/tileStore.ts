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
    const tileNumber = Math.floor(offsetAddress / (8 * this.bitDepth))
    const rowNumber = Math.floor((offsetAddress % (8 * this.bitDepth)) / this.bitDepth)
    // Stores whether we're adjusting the first or second byte that defines a row.
    const rowByteIndex = offsetAddress & (this.bitDepth - 1)

    for (let i = 0; i < 8; i++) {
      const bit = (value & 1) << rowByteIndex
      value >>= 1

      this.tiles[tileNumber][rowNumber][7 - i] &= 1 << ((this.bitDepth - 1) - rowByteIndex)
      this.tiles[tileNumber][rowNumber][7 - i] |= bit

      this.flippedTiles[tileNumber][rowNumber][i] &= 1 << ((this.bitDepth - 1) - rowByteIndex)
      this.flippedTiles[tileNumber][rowNumber][i] |= bit
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