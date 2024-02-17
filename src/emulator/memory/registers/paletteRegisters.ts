import { ByteRef, GetSetByteRef } from "../../refs/byteRef";

export enum ColourStyle {
  Washed,
  Raw,
}

export class PaletteRam {
  data = new Uint8Array(64)
  rawColours: number[][][] = []
  scaledColours: number[][][] = []

  indexRegister: ByteRef
  accessRegister: ByteRef

  autoIncrement = false
  index: number

  colourStyle = ColourStyle.Raw

  constructor() {
    this.indexRegister = new GetSetByteRef(
      () => (this.autoIncrement ? 0x80 : 0) + this.index,
      (value) => {
        this.autoIncrement = (value & 0x80) > 0
        this.index = value & 0x3F
      }
    )
    this.accessRegister = new GetSetByteRef(
      () => this.data[this.index],
      (value) => {
        this.data[this.index] = value
        const paletteId = this.index >> 3
        const colourId = (this.index >> 1) & 0x3
        const byteNumber = this.index & 1
        if (byteNumber == 0) {
          // Update red
          this.rawColours[paletteId][colourId][0] = value & 0b00011111

          // Update lower three bits of green
          this.rawColours[paletteId][colourId][1] &= 0b11000
          this.rawColours[paletteId][colourId][1] |= ((value & 0b11100000) >> 5)
        } else {
          // Update upper two bits of green
          this.rawColours[paletteId][colourId][1] &= 0b00111
          this.rawColours[paletteId][colourId][1] |= ((value & 0b00000011) << 3)

          // Update blue
          this.rawColours[paletteId][colourId][2] = (value & 0b01111100) >> 2
        }
        this.updateColour(paletteId, colourId)

        if (this.autoIncrement) { this.index++ }
      }
    )
    for (let palette = 0; palette < 8; palette++) {
      this.rawColours.push([])
      this.scaledColours.push([])
      for (let colour = 0; colour < 4; colour++) {
        this.rawColours[palette].push([])
        this.scaledColours[palette].push([])
        for (let i = 0; i < 3; i++) {
          this.rawColours[palette][colour][i] = 0
          this.scaledColours[palette][colour][i] = 0
        }
      }
    }
  }

  updateColour(paletteId: number, colourId: number) {
    const red = this.rawColours[paletteId][colourId][0]
    const green = this.rawColours[paletteId][colourId][1]
    const blue = this.rawColours[paletteId][colourId][2]

    switch (this.colourStyle) {
      case ColourStyle.Washed:
        // Desaturate colours a bit for display
        this.scaledColours[paletteId][colourId][0] = 0.8 * (red << 3) + 0.1 * (green << 3) + 0.1 * (blue << 3)
        this.scaledColours[paletteId][colourId][1] = 0.8 * (green << 3) + 0.1 * (red << 3) + 0.1 * (blue << 3)
        this.scaledColours[paletteId][colourId][2] = 0.8 * (blue << 3) + 0.1 * (red << 3) + 0.1 * (green << 3)
        break
      case ColourStyle.Raw:
        console.log("RAW!")
        this.scaledColours[paletteId][colourId][0] = (red << 3)
        this.scaledColours[paletteId][colourId][1] = (green << 3)
        this.scaledColours[paletteId][colourId][2] = (blue << 3)
        break
    }
  }

  updateAllColours() {
    for (let paletteId = 0; paletteId < 8; paletteId++) {
      for (let colourId = 0; colourId < 4; colourId++) {
        this.updateColour(paletteId, colourId)
      }
    }
  }
}