type Tile = number[][]

export class TileStore {
  size: number
  tiles: Tile[]
  flippedTiles: Tile[]

  constructor(size: number) {
    this.size = size
    this.clearTiles()
  }

  writeByte(offsetAddress: number, value: number): void {
    const tileNumber = offsetAddress >> 4
    const rowNumber = (offsetAddress & 0xf) >> 1
    // Stores whether we're adjusting the first or second byte that defines a row.
    const rowByteIndex = offsetAddress & 1

    for (let i = 0; i < 8; i++) {
      const bit = (value & 1) << rowByteIndex
      value >>= 1

      this.tiles[tileNumber][rowNumber][7 - i] &= 1 << (1 - rowByteIndex)
      this.tiles[tileNumber][rowNumber][7 - i] |= bit

      this.flippedTiles[tileNumber][rowNumber][i] &= 1 << (1 - rowByteIndex)
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