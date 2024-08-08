export default class AttributeFile {
  data = [...new Array(18)].map(_ => 
    [...new Array(20)].map(_ => 0))

  constructor() {
  }

  setBlockInterior(
    x1: number, y1: number, x2: number, y2: number,
    paletteId: number
  ) : void {
    for (let y = y1 + 1; y < y2; y++) {
      for (let x = x1 + 1; x < x2; x++) {
        this.data[y][x] = paletteId
      }
    }
  }

  setBlockExterior(
    x1: number, y1: number, x2: number, y2: number,
    paletteId: number
  ) : void {
    for (let y = 0; y < y1; y++) {
      for (let x = 0; x < x1; x++) {
        this.data[y][x] = paletteId
      }
    }
    for (let y = y2 + 1; y < 18; y++) {
      for (let x = x2 + 1; x < 20; x++) {
        this.data[y][x] = paletteId
      }
    }
  }

  setBlockBoundary(
    x1: number, y1: number, x2: number, y2: number,
    paletteId: number
  ) : void {
    for (let y = y1 + 1; y < y2; y++) {
      this.data[y][x1] = paletteId
      this.data[y][x2] = paletteId
    }

    for (let x = x1 + 1; x < x2; x++) {
      this.data[y1][x] = paletteId
      this.data[y2][x] = paletteId
    }
  }
}