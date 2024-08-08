export default class SuperPalette {
  colours: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]

  constructor(bytes: number[]) {
    for (let colourId = 0; colourId < 4; colourId++) {
      const byte1 = bytes[(colourId << 1) + 0]
      const byte2 = bytes[(colourId << 1) + 1]

      const red = (byte1 & 0b00011111) << 3
      const green = ((
        ((byte1 & 0b11100000) >> 5)
        + ((byte2 & 0b00000011) << 3)
      ) << 3)
      const blue = ((byte2 & 0b01111100) >> 2) << 3

      this.colours[colourId] = [red, green, blue]
    }
  }
}