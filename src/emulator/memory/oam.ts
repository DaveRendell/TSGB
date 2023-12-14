import { ByteRef } from "../refs/byteRef"
import { Sprite } from "./sprite"

const BASE_ADDRESS = 0xFE00

export class OAM {
  sprites: Sprite[] = []

  constructor() {
    for (let i = 0; i < 40; i++) {
      this.sprites.push(new Sprite())
    }
  }

  at(address: number): ByteRef {
    const adjustedAddress = address - BASE_ADDRESS
    const spriteNumber = adjustedAddress >> 2
    const byteNumber = adjustedAddress & 3
    return this.sprites[spriteNumber].bytes[byteNumber]
  }
}